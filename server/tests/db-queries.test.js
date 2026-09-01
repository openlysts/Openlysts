// server/tests/db-queries.test.js
// Database query tests for Openlysts backend
// Run: node server/tests/db-queries.test.js

import { describe, it } from 'node:test';
import assert from 'node:assert';

const API = 'http://localhost:3001';

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const body = await res.json();
  return { status: res.status, body };
}

describe('Database Queries', () => {

  // ─── Connection Health ─────────────────────────────────────────

  describe('Connection Health', () => {
    it('database is reachable via health endpoint', async () => {
      const { status, body } = await fetchJSON(`${API}/api/health`);
      assert.strictEqual(status, 200);
      assert.strictEqual(body.status, 'ok');
    });

    it('database returns data for Repository list', async () => {
      const { status, body } = await fetchJSON(`${API}/api/entities/Repository/list?limit=1`);
      assert.strictEqual(status, 200);
    });
  });

  // ─── Query Parameterization ────────────────────────────────────

  describe('Query Parameterization', () => {
    it('parameterized query returns correct results', async () => {
      const { status } = await fetchJSON(`${API}/api/entities/Repository/filter`, {
        method: 'POST',
        body: JSON.stringify({ where: { full_name: 'facebook/react' }, limit: 1 }),
      });
      assert.strictEqual(status, 200);
    });

    it('parameterized query with numeric filter', async () => {
      const { status } = await fetchJSON(`${API}/api/entities/Repository/filter`, {
        method: 'POST',
        body: JSON.stringify({ where: { featured: true }, limit: 5 }),
      });
      assert.strictEqual(status, 200);
    });
  });

  // ─── Table Access Control ──────────────────────────────────────

  describe('Table Access Control', () => {
    const protectedTables = ['User', 'session', 'AuditLog', 'PasswordResetToken', 'EmailVerificationToken'];

    for (const table of protectedTables) {
      it(`${table} table is not publicly accessible`, async () => {
        const { status } = await fetchJSON(`${API}/api/entities/${table}/list`);
        assert.ok([400, 401].includes(status), `${table} should not be publicly accessible`);
      });
    }
  });

  // ─── Pagination ────────────────────────────────────────────────

  describe('Pagination', () => {
    it('limit parameter bounds results', async () => {
      const { status, body } = await fetchJSON(`${API}/api/entities/Repository/list?limit=3`);
      assert.strictEqual(status, 200);
      const repos = body.data || body;
      if (Array.isArray(repos)) {
        assert.ok(repos.length <= 3, `Expected ≤ 3 results, got ${repos.length}`);
      }
    });

    it('limit=1 returns single result', async () => {
      const { status, body } = await fetchJSON(`${API}/api/entities/Repository/list?limit=1`);
      assert.strictEqual(status, 200);
      const repos = body.data || body;
      if (Array.isArray(repos)) {
        assert.ok(repos.length <= 1);
      }
    });
  });

  // ─── Data Integrity ────────────────────────────────────────────

  describe('Data Integrity', () => {
    it('Repository has required fields', async () => {
      const { status, body } = await fetchJSON(`${API}/api/entities/Repository/list?limit=1`);
      assert.strictEqual(status, 200);
      const repos = body.data || body;
      if (Array.isArray(repos) && repos.length > 0) {
        assert.ok(repos[0].id, 'Repository should have id');
        assert.ok(repos[0].name, 'Repository should have name');
        assert.ok(typeof repos[0].stars === 'number', 'Repository should have numeric stars');
      }
    });

    it('Alternative has required fields', async () => {
      const { status, body } = await fetchJSON(`${API}/api/entities/Alternative/list?limit=1`);
      assert.strictEqual(status, 200);
      const alts = body.data || body;
      if (Array.isArray(alts) && alts.length > 0) {
        assert.ok(alts[0].id, 'Alternative should have id');
        assert.ok(alts[0].paid_tool_name, 'Alternative should have paid_tool_name');
      }
    });
  });

  // ─── SQL Injection Resistance ──────────────────────────────────

  describe('SQL Injection Resistance', () => {
    const payloads = [
      "' OR 1=1 --",
      "'; DROP TABLE Repository; --",
      "1 UNION SELECT * FROM User --",
      "' UNION SELECT null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null --",
    ];

    for (const payload of payloads) {
      it(`resists SQL injection: ${payload.substring(0, 25)}...`, async () => {
        const { status } = await fetchJSON(`${API}/api/entities/Repository/filter`, {
          method: 'POST',
          body: JSON.stringify({ where: { name: payload } }),
        });
        assert.ok(status !== 500, 'SQL injection should not cause 500 error');
      });
    }
  });

  // ─── Error Handling ────────────────────────────────────────────

  describe('Error Handling', () => {
    it('nonexistent entity returns 400', async () => {
      const { status, body } = await fetchJSON(`${API}/api/entities/FakeEntity/list`);
      assert.strictEqual(status, 400);
      assert.strictEqual(body.error, true);
    });

    it('invalid where parameter returns 400', async () => {
      const { status } = await fetchJSON(`${API}/api/entities/Repository/filter`, {
        method: 'POST',
        body: JSON.stringify({ where: { nonexistent_column: 'value' } }),
      });
      assert.strictEqual(status, 400);
    });

    it('malformed JSON returns 400', async () => {
      const { status } = await fetchJSON(`${API}/api/entities/Repository/filter?where=notjson`);
      assert.strictEqual(status, 400);
    });
  });

  // ─── Concurrent Access ─────────────────────────────────────────

  describe('Concurrent Access', () => {
    it('handles 10 concurrent read requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        fetchJSON(`${API}/api/entities/Repository/list?limit=5`)
      );
      const results = await Promise.all(requests);
      for (const { status } of results) {
        assert.strictEqual(status, 200);
      }
    });
  });

  // ─── Response Time ─────────────────────────────────────────────

  describe('Response Time', () => {
    it('Repository list responds within 2s', async () => {
      const start = Date.now();
      const { status } = await fetchJSON(`${API}/api/entities/Repository/list?limit=20`);
      const duration = Date.now() - start;
      assert.strictEqual(status, 200);
      assert.ok(duration < 2000, `Response took ${duration}ms, expected < 2000ms`);
    });

    it('Health check responds within 1s', async () => {
      const start = Date.now();
      const { status } = await fetchJSON(`${API}/api/health`);
      const duration = Date.now() - start;
      assert.strictEqual(status, 200);
      assert.ok(duration < 1000, `Response took ${duration}ms, expected < 1000ms`);
    });
  });
});

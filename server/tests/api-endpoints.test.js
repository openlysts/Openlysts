// server/tests/api-endpoints.test.js
// Comprehensive API endpoint tests for Openlysts backend
// Run: node server/tests/api-endpoints.test.js

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

const API = 'http://localhost:3001';

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const body = await res.json();
  return { status: res.status, body, headers: Object.fromEntries(res.headers) };
}

describe('API Endpoints', () => {

  // ─── Health Check ──────────────────────────────────────────────

  describe('GET /api/health', () => {
    it('returns 200 with status ok', async () => {
      const { status, body } = await fetchJSON(`${API}/api/health`);
      assert.strictEqual(status, 200);
      assert.strictEqual(body.status, 'ok');
    });
  });

  // ─── Entity Endpoints ──────────────────────────────────────────

  describe('Entity Endpoints', () => {
    it('GET /api/entities/Repository/list returns repos', async () => {
      const { status, body } = await fetchJSON(`${API}/api/entities/Repository/list?limit=5`);
      assert.strictEqual(status, 200);
    });

    it('GET /api/entities/Alternative/list returns alternatives', async () => {
      const { status } = await fetchJSON(`${API}/api/entities/Alternative/list?limit=5`);
      assert.strictEqual(status, 200);
    });

    it('GET /api/entities/NonexistentEntity/list returns 400', async () => {
      const { status } = await fetchJSON(`${API}/api/entities/NonexistentEntity/list`);
      assert.strictEqual(status, 400);
    });

    it('POST /api/entities/Repository/filter with valid where', async () => {
      const { status } = await fetchJSON(`${API}/api/entities/Repository/filter`, {
        method: 'POST',
        body: JSON.stringify({ where: { featured: true }, limit: 5 }),
      });
      assert.strictEqual(status, 200);
    });

    it('POST /api/entities/Repository/filter with invalid where returns 400', async () => {
      const { status } = await fetchJSON(`${API}/api/entities/Repository/filter`, {
        method: 'POST',
        body: JSON.stringify({ where: { invalid_field: 'test' } }),
      });
      assert.strictEqual(status, 400);
    });

    it('GET /api/entities/Repository/delete returns 405 (method not allowed)', async () => {
      const { status } = await fetchJSON(`${API}/api/entities/Repository/delete`);
      assert.strictEqual(status, 405);
    });
  });

  // ─── Auth Endpoints ────────────────────────────────────────────

  describe('Auth Endpoints', () => {
    it('POST /api/auth/login with empty body returns 400', async () => {
      const { status, body } = await fetchJSON(`${API}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      assert.strictEqual(status, 400);
      assert.strictEqual(body.error, true);
    });

    it('POST /api/auth/login with invalid credentials returns 401', async () => {
      const { status, body } = await fetchJSON(`${API}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: 'nonexistent@test.com', password: 'wrong', turnstileToken: 'test' }),
      });
      assert.strictEqual(status, 401);
      assert.strictEqual(body.error, true);
    });

    it('POST /api/auth/register with empty body returns 400', async () => {
      const { status } = await fetchJSON(`${API}/api/auth/register`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      assert.strictEqual(status, 400);
    });

    it('POST /api/auth/register with invalid email returns 400', async () => {
      const { status } = await fetchJSON(`${API}/api/auth/register`, {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', email: 'invalid', password: 'Test1234!', turnstileToken: 'test', consent: true }),
      });
      assert.strictEqual(status, 400);
    });

    it('POST /api/auth/register with weak password returns 400', async () => {
      const { status } = await fetchJSON(`${API}/api/auth/register`, {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', email: 'test@test.com', password: '123', turnstileToken: 'test', consent: true }),
      });
      assert.strictEqual(status, 400);
    });

    it('GET /api/auth/me without session returns user null', async () => {
      const { status, body } = await fetchJSON(`${API}/api/auth/me`);
      assert.strictEqual(status, 200);
      assert.strictEqual(body.user, null);
    });

    it('POST /api/auth/password/reset-request returns success', async () => {
      const { status, body } = await fetchJSON(`${API}/api/auth/password/reset-request`, {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com' }),
      });
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
    });

    it('POST /api/auth/password/reset with invalid token returns 400', async () => {
      const { status, body } = await fetchJSON(`${API}/api/auth/password/reset`, {
        method: 'POST',
        body: JSON.stringify({ token: 'invalid', password: 'Test1234!' }),
      });
      assert.strictEqual(status, 400);
      assert.strictEqual(body.error, true);
    });
  });

  // ─── Protected Endpoints ───────────────────────────────────────

  describe('Protected Endpoints (401 Without Auth)', () => {
    const protectedEndpoints = [
      { method: 'GET', url: `${API}/api/admin/telemetry` },
      { method: 'POST', url: `${API}/api/admin/repos/sync` },
      { method: 'GET', url: `${API}/api/profile` },
      { method: 'GET', url: `${API}/api/mfa/status` },
    ];

    for (const ep of protectedEndpoints) {
      it(`${ep.method} ${ep.url.split('/api/')[1]} returns 401`, async () => {
        const { status } = await fetchJSON(ep.url, { method: ep.method });
        assert.strictEqual(status, 401);
      });
    }
  });

  // ─── Security ──────────────────────────────────────────────────

  describe('Security', () => {
    it('no X-Powered-By header', async () => {
      const { headers } = await fetchJSON(`${API}/api/health`);
      assert.strictEqual(headers['x-powered-by'], undefined);
    });

    it('X-Content-Type-Options: nosniff', async () => {
      const { headers } = await fetchJSON(`${API}/api/health`);
      assert.strictEqual(headers['x-content-type-options'], 'nosniff');
    });

    it('error responses do not leak stack traces', async () => {
      const { body } = await fetchJSON(`${API}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com', password: 'wrong', turnstileToken: 'test' }),
      });
      const bodyStr = JSON.stringify(body);
      assert.ok(!bodyStr.includes('at '));
      assert.ok(!bodyStr.includes('node_modules'));
      assert.ok(!bodyStr.includes('/server/'));
    });

    it('password reset does not enumerate', async () => {
      const res1 = await fetchJSON(`${API}/api/auth/password/reset-request`, {
        method: 'POST',
        body: JSON.stringify({ email: 'existing@test.com' }),
      });
      const res2 = await fetchJSON(`${API}/api/auth/password/reset-request`, {
        method: 'POST',
        body: JSON.stringify({ email: 'nonexistent999@test.com' }),
      });
      assert.strictEqual(res1.body.message, res2.body.message);
    });
  });

  // ─── Rate Limiting ─────────────────────────────────────────────

  describe('Rate Limiting', () => {
    it('login rate limiting triggers after multiple attempts', async () => {
      const statuses = [];
      for (let i = 0; i < 8; i++) {
        const { status } = await fetchJSON(`${API}/api/auth/login`, {
          method: 'POST',
          body: JSON.stringify({ email: 'ratelimittest@test.com', password: 'wrong', turnstileToken: 'test' }),
        });
        statuses.push(status);
      }
      const rateLimited = statuses.filter(s => s === 429);
      assert.ok(rateLimited.length > 0, 'Expected at least one 429 response');
    });
  });

  // ─── Response Format ───────────────────────────────────────────

  describe('Response Format', () => {
    it('API returns JSON content type', async () => {
      const { headers } = await fetchJSON(`${API}/api/health`);
      assert.ok(headers['content-type'].includes('application/json'));
    });

    it('error responses have consistent format', async () => {
      const { body } = await fetchJSON(`${API}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      assert.strictEqual(body.error, true);
      assert.ok(typeof body.message === 'string');
    });
  });
});

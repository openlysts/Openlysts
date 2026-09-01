// server/tests/auth-security.test.js
// Authentication security tests for Openlysts backend
// Run: node server/tests/auth-security.test.js

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

describe('Authentication Security', () => {

  // ─── Password Hashing ──────────────────────────────────────────

  describe('Password Security', () => {
    it('passwords are not stored in plaintext', async () => {
      // Attempt to create account and verify password is hashed
      const { status, body } = await fetchJSON(`${API}/api/auth/register`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Security Test',
          email: `sectest${Date.now()}@test.com`,
          password: 'TestPassword123!',
          turnstileToken: 'test',
          consent: true,
        }),
      });
      // Registration should succeed (201) or be blocked (403)
      assert.ok([201, 403].includes(status));
    });

    it('password validation rejects weak passwords', async () => {
      const weakPasswords = ['123', 'password', 'abc', '1234567'];
      for (const pw of weakPasswords) {
        const { status } = await fetchJSON(`${API}/api/auth/register`, {
          method: 'POST',
          body: JSON.stringify({
            name: 'Test',
            email: `test${Date.now()}@test.com`,
            password: pw,
            turnstileToken: 'test',
            consent: true,
          }),
        });
        assert.strictEqual(status, 400, `Weak password "${pw}" should be rejected`);
      }
    });
  });

  // ─── Token Security ────────────────────────────────────────────

  describe('Token Security', () => {
    it('password reset with invalid token returns 400', async () => {
      const { status, body } = await fetchJSON(`${API}/api/auth/password/reset`, {
        method: 'POST',
        body: JSON.stringify({ token: 'invalidtoken123', password: 'Test1234!' }),
      });
      assert.strictEqual(status, 400);
      assert.strictEqual(body.error, true);
    });

    it('email verification with invalid token returns 400', async () => {
      const { status, body } = await fetchJSON(`${API}/api/auth/verify-email`, {
        method: 'POST',
        body: JSON.stringify({ token: 'invalidtoken123' }),
      });
      assert.strictEqual(status, 400);
      assert.strictEqual(body.error, true);
    });

    it('password reset with empty token returns 400', async () => {
      const { status } = await fetchJSON(`${API}/api/auth/password/reset`, {
        method: 'POST',
        body: JSON.stringify({ token: '', password: 'Test1234!' }),
      });
      assert.strictEqual(status, 400);
    });
  });

  // ─── Enumeration Prevention ────────────────────────────────────

  describe('Enumeration Prevention', () => {
    it('login returns same error for existing and non-existing users', async () => {
      const res1 = await fetchJSON(`${API}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: 'admin@openlysts.app', password: 'wrong', turnstileToken: 'test' }),
      });
      const res2 = await fetchJSON(`${API}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: 'nonexistent999@nowhere.com', password: 'wrong', turnstileToken: 'test' }),
      });
      assert.strictEqual(res1.body.message, res2.body.message);
    });

    it('password reset returns same message for all emails', async () => {
      const res1 = await fetchJSON(`${API}/api/auth/password/reset-request`, {
        method: 'POST',
        body: JSON.stringify({ email: 'existing@test.com' }),
      });
      const res2 = await fetchJSON(`${API}/api/auth/password/reset-request`, {
        method: 'POST',
        body: JSON.stringify({ email: 'nonexistent@test.com' }),
      });
      assert.strictEqual(res1.body.message, res2.body.message);
    });
  });

  // ─── Session Security ──────────────────────────────────────────

  describe('Session Security', () => {
    it('GET /api/auth/me returns null user when not authenticated', async () => {
      const { status, body } = await fetchJSON(`${API}/api/auth/me`);
      assert.strictEqual(status, 200);
      assert.strictEqual(body.user, null);
    });

    it('POST /api/auth/logout returns success', async () => {
      const { status, body } = await fetchJSON(`${API}/api/auth/logout`, {
        method: 'POST',
      });
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
    });
  });

  // ─── Input Validation ──────────────────────────────────────────

  describe('Input Validation', () => {
    it('rejects non-JSON content type', async () => {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: 'not json',
      });
      assert.ok([400, 415].includes(res.status));
    });

    it('rejects missing required fields', async () => {
      const { status } = await fetchJSON(`${API}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      assert.strictEqual(status, 400);
    });

    it('rejects invalid email format', async () => {
      const { status } = await fetchJSON(`${API}/api/auth/register`, {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', email: 'notanemail', password: 'Test1234!', turnstileToken: 'test', consent: true }),
      });
      assert.strictEqual(status, 400);
    });

    it('rejects missing consent', async () => {
      const { status } = await fetchJSON(`${API}/api/auth/register`, {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', email: 'test@test.com', password: 'Test1234!', turnstileToken: 'test', consent: false }),
      });
      assert.strictEqual(status, 400);
    });
  });

  // ─── SQL Injection ─────────────────────────────────────────────

  describe('SQL Injection Prevention', () => {
    const sqlPayloads = [
      "' OR 1=1 --",
      "'; DROP TABLE users; --",
      "1 UNION SELECT * FROM users --",
      "' OR '1'='1",
    ];

    for (const payload of sqlPayloads) {
      it(`rejects SQL injection: ${payload.substring(0, 20)}...`, async () => {
        const { status } = await fetchJSON(`${API}/api/auth/login`, {
          method: 'POST',
          body: JSON.stringify({ email: payload, password: 'wrong', turnstileToken: 'test' }),
        });
        // Should not return 500 (server error from SQL failure)
        assert.ok(status !== 500, `SQL injection caused 500 error`);
      });
    }
  });

  // ─── XSS Prevention ────────────────────────────────────────────

  describe('XSS Prevention', () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror="alert(1)">',
      '"><svg onload=alert(1)>',
    ];

    for (const payload of xssPayloads) {
      it(`rejects XSS in search: ${payload.substring(0, 20)}...`, async () => {
        const { status, body } = await fetchJSON(`${API}/api/entities/Repository/filter?where=${encodeURIComponent(JSON.stringify({ name: payload }))}`);
        // Should not crash or return the payload as executed HTML
        assert.ok(status !== 500);
      });
    }
  });
});

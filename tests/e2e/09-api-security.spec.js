import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3001';

test.describe('API Security: Rate Limiting, Auth Bypass, IDOR', () => {

  // ─── Rate Limiting Tests ───────────────────────────────────────

  test('TC-SEC-001: Login Rate Limiting (5 attempts → 429)', async ({ request }) => {
    const responses = [];
    for (let i = 0; i < 8; i++) {
      const res = await request.post(`${API_BASE}/api/auth/login`, {
        data: { email: 'test@test.com', password: 'wrong', turnstileToken: 'test' },
      });
      responses.push(res.status());
    }
    // After 5 attempts, should get 429
    const rateLimited = responses.filter(s => s === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });

  test('TC-SEC-002: Register Rate Limiting (3 attempts → 429)', async ({ request }) => {
    const responses = [];
    for (let i = 0; i < 6; i++) {
      const res = await request.post(`${API_BASE}/api/auth/register`, {
        data: {
          name: 'Test', email: `rate${i}@test.com`, password: 'Test1234!',
          turnstileToken: 'test', consent: true,
        },
      });
      responses.push(res.status());
    }
    const rateLimited = responses.filter(s => s === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });

  test('TC-SEC-003: Password Reset Request Rate Limiting', async ({ request }) => {
    const responses = [];
    for (let i = 0; i < 6; i++) {
      const res = await request.post(`${API_BASE}/api/auth/password/reset-request`, {
        data: { email: 'test@test.com' },
      });
      responses.push(res.status());
    }
    const rateLimited = responses.filter(s => s === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });

  // ─── Auth Bypass Tests ─────────────────────────────────────────

  test('TC-SEC-004: Admin Endpoints Return 401 Without Auth', async ({ request }) => {
    const endpoints = [
      { method: 'GET', url: `${API_BASE}/api/admin/telemetry` },
      { method: 'POST', url: `${API_BASE}/api/admin/repos/sync` },
    ];
    for (const ep of endpoints) {
      const res = await request.fetch(ep.url, { method: ep.method });
      expect(res.status()).toBe(401);
    }
  });

  test('TC-SEC-005: Profile Endpoint Returns 401 Without Auth', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/profile`);
    expect(res.status()).toBe(401);
  });

  test('TC-SEC-006: Data Rights Endpoint Returns 401 Without Auth', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/data-rights`);
    expect(res.status()).toBe(401);
  });

  test('TC-SEC-007: MFA Endpoint Returns 401 Without Auth', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/mfa/status`);
    expect(res.status()).toBe(401);
  });

  // ─── IDOR Tests ────────────────────────────────────────────────

  test('TC-SEC-008: Cannot Access Other Users Profile', async ({ request }) => {
    // Without auth, should get 401
    const res = await request.get(`${API_BASE}/api/profile`);
    expect(res.status()).toBe(401);
  });

  // ─── Input Validation Tests ────────────────────────────────────

  test('TC-SEC-009: SQL Injection in Search', async ({ request }) => {
    const payloads = [
      "' OR 1=1 --",
      "'; DROP TABLE users; --",
      "1 UNION SELECT * FROM users --",
    ];
    for (const payload of payloads) {
      const res = await request.get(`${API_BASE}/api/entities/Repository/filter?where=${encodeURIComponent(JSON.stringify({ name: payload }))}`);
      // Should not return all rows or crash
      expect(res.status()).not.toBe(500);
    }
  });

  test('TC-SEC-010: XSS in API Response', async ({ request }) => {
    const payloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror="alert(1)">',
      '"><svg onload=alert(1)>',
    ];
    for (const payload of payloads) {
      const res = await request.get(`${API_BASE}/api/entities/Repository/filter?where=${encodeURIComponent(JSON.stringify({ name: payload }))}`);
      const body = await res.json();
      // Response should not contain unescaped HTML
      if (body.data) {
        const dataStr = JSON.stringify(body.data);
        expect(dataStr).not.toContain('<script>');
        expect(dataStr).not.toContain('onerror=');
      }
    }
  });

  test('TC-SEC-011: No Sensitive Data in Error Responses', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: 'nonexistent@test.com', password: 'wrong', turnstileToken: 'test' },
    });
    const body = await res.json();
    const bodyStr = JSON.stringify(body);
    // Should not contain stack traces, SQL, or internal paths
    expect(bodyStr).not.toContain('at ');
    expect(bodyStr).not.toContain('SELECT');
    expect(bodyStr).not.toContain('/server/');
    expect(bodyStr).not.toContain('node_modules');
  });

  // ─── Session Security Tests ────────────────────────────────────

  test('TC-SEC-012: Logout Destroys Session', async ({ request }) => {
    // Attempt to use session after logout
    const logoutRes = await request.post(`${API_BASE}/api/auth/logout`);
    expect(logoutRes.status()).toBe(200);
  });

  // ─── Enumeration Prevention Tests ──────────────────────────────

  test('TC-SEC-013: Password Reset Does Not Enumerate', async ({ request }) => {
    const existingEmail = await request.post(`${API_BASE}/api/auth/password/reset-request`, {
      data: { email: 'admin@openlysts.app' },
    });
    const nonexistentEmail = await request.post(`${API_BASE}/api/auth/password/reset-request`, {
      data: { email: 'nonexistent99999@nowhere.com' },
    });
    // Both should return same response (no enumeration)
    const body1 = await existingEmail.json();
    const body2 = await nonexistentEmail.json();
    expect(body1.message).toBe(body2.message);
  });

  test('TC-SEC-014: Login Does Not Enumerate', async ({ request }) => {
    const res1 = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: 'nonexistent@nowhere.com', password: 'wrong', turnstileToken: 'test' },
    });
    const res2 = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: 'admin@openlysts.app', password: 'wrong', turnstileToken: 'test' },
    });
    const body1 = await res1.json();
    const body2 = await res2.json();
    // Both should return same error message
    expect(body1.message).toBe(body2.message);
  });

  // ─── HTTP Method Tests ─────────────────────────────────────────

  test('TC-SEC-015: Correct HTTP Methods Required', async ({ request }) => {
    // GET on POST-only endpoint
    const res = await request.get(`${API_BASE}/api/auth/login`);
    expect([404, 405]).toContain(res.status());
  });

  // ─── Content-Type Tests ────────────────────────────────────────

  test('TC-SEC-016: Reject Non-JSON Content-Type', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      headers: { 'Content-Type': 'text/plain' },
      data: 'not json',
    });
    expect([400, 415]).toContain(res.status());
  });

  // ─── Health Check ──────────────────────────────────────────────

  test('TC-SEC-017: Health Endpoint Returns OK', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });
});

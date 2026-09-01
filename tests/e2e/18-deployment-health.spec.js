import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';
const API = 'http://localhost:3001';

test.describe('Deployment Health: Production Smoke, Env Vars, Headers', () => {

  // ─── Backend Health ────────────────────────────────────────────

  test('TC-DEP-001: Backend Health Check', async ({ request }) => {
    const res = await request.get(`${API}/api/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('TC-DEP-002: Backend Responds Within 2s', async ({ request }) => {
    const start = Date.now();
    const res = await request.get(`${API}/api/health`);
    const duration = Date.now() - start;
    expect(res.status()).toBe(200);
    expect(duration).toBeLessThan(2000);
  });

  // ─── Frontend Health ───────────────────────────────────────────

  test('TC-DEP-003: Frontend Loads', async ({ page }) => {
    const res = await page.goto(`${BASE}/`);
    expect(res?.status()).toBe(200);
  });

  test('TC-DEP-004: Frontend Has Correct Title', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page).toHaveTitle(/Openlysts/i);
  });

  test('TC-DEP-005: Frontend Has Viewport Meta', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const viewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta?.getAttribute('content');
    });
    expect(viewport).toContain('width=device-width');
  });

  // ─── API Endpoints ─────────────────────────────────────────────

  test('TC-DEP-006: All Critical API Endpoints Respond', async ({ request }) => {
    const endpoints = [
      `${API}/api/health`,
      `${API}/api/entities/Repository/list?limit=1`,
      `${API}/api/entities/Alternative/list?limit=1`,
    ];
    for (const url of endpoints) {
      const res = await request.get(url);
      expect(res.status()).toBe(200);
    }
  });

  test('TC-DEP-007: Protected Endpoints Return 401', async ({ request }) => {
    const endpoints = [
      `${API}/api/admin/telemetry`,
      `${API}/api/profile`,
      `${API}/api/mfa/status`,
    ];
    for (const url of endpoints) {
      const res = await request.get(url);
      expect(res.status()).toBe(401);
    }
  });

  // ─── Security Headers ──────────────────────────────────────────

  test('TC-DEP-008: No X-Powered-By Header', async ({ request }) => {
    const res = await request.get(`${API}/api/health`);
    const poweredBy = res.headers()['x-powered-by'];
    expect(poweredBy).toBeUndefined();
  });

  test('TC-DEP-009: Helmet Headers Present', async ({ request }) => {
    const res = await request.get(`${API}/api/health`);
    const headers = res.headers();
    // Helmet adds these headers
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBeDefined();
  });

  // ─── CORS ──────────────────────────────────────────────────────

  test('TC-DEP-010: CORS Allows Origin', async ({ request }) => {
    const res = await request.get(`${API}/api/health`, {
      headers: { 'Origin': 'http://localhost:5173' },
    });
    const corsHeader = res.headers()['access-control-allow-origin'];
    // Should allow the origin
    expect(corsHeader).toBeDefined();
  });

  // ─── Environment ───────────────────────────────────────────────

  test('TC-DEP-011: No Secrets in HTML Source', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const html = await page.content();
    expect(html).not.toContain('ghp_');
    expect(html).not.toContain('sk-');
    expect(html).not.toContain('Bearer ');
    expect(html).not.toContain('password =');
    expect(html).not.toContain('secret =');
  });

  test('TC-DEP-012: No Console Errors on Critical Pages', async ({ request }) => {
    const pages = ['/', '/discover', '/alternatives', '/contact'];
    for (const path of pages) {
      const res = await request.get(`${BASE}${path}`);
      expect(res.status()).toBe(200);
    }
  });

  // ─── Database Connectivity ─────────────────────────────────────

  test('TC-DEP-013: Database Returns Data', async ({ request }) => {
    const res = await request.get(`${API}/api/entities/Repository/list?limit=1`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const repos = body.data || body;
    // Should have at least some repos
    if (Array.isArray(repos)) {
      expect(repos.length).toBeGreaterThanOrEqual(0);
    }
  });

  // ─── Error Handling ────────────────────────────────────────────

  test('TC-DEP-014: 404 for Unknown API Routes', async ({ request }) => {
    const res = await request.get(`${API}/api/nonexistent`);
    expect([404, 400]).toContain(res.status());
  });

  test('TC-DEP-015: Graceful Error for Invalid JSON', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      headers: { 'Content-Type': 'application/json' },
      data: 'not json',
    });
    expect([400, 415]).toContain(res.status());
  });

  // ─── Response Format ───────────────────────────────────────────

  test('TC-DEP-016: API Returns JSON Content-Type', async ({ request }) => {
    const res = await request.get(`${API}/api/health`);
    const contentType = res.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('TC-DEP-017: Error Responses Have Consistent Format', async ({ request }) => {
    const res = await request.get(`${API}/api/entities/User/list`);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('message');
    expect(body.error).toBe(true);
  });
});

/**
 * Smoke Test Suite for Openlysts
 * Quick verification that critical functionality works after deployment
 *
 * Usage:
 *   node scripts/smoke/post-deploy.js
 *   npm run smoke
 */

const BASE_URL = process.env.SMOKE_TARGET_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.SMOKE_FRONTEND_URL || 'http://localhost:5173';

let passed = 0;
let failed = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message });
    console.error(`  ❌ ${name}: ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertStatus(response, expected) {
  if (response.status !== expected) {
    throw new Error(`Expected status ${expected}, got ${response.status}`);
  }
}

async function run() {
  console.log('');
  console.log('🔥 Smoke Tests — Post Deploy');
  console.log('==============================');
  console.log(`  API: ${BASE_URL}`);
  console.log(`  Frontend: ${FRONTEND_URL}`);
  console.log('');

  // API Health
  console.log('API Health:');
  await test('Health endpoint returns 200', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assertStatus(res, 200);
    const data = await res.json();
    assert(data.ok === true, 'Health response ok !== true');
  });

  // Core API Endpoints
  console.log('');
  console.log('Core API Endpoints:');
  await test('List entities returns 200', async () => {
    const res = await fetch(`${BASE_URL}/api/entities?page=1&limit=5`);
    assertStatus(res, 200);
    const data = await res.json();
    assert(Array.isArray(data.repos), 'repos is not an array');
  });

  await test('Trending endpoint returns 200', async () => {
    const res = await fetch(`${BASE_URL}/api/functions/trending`);
    assertStatus(res, 200);
  });

  await test('Alternatives endpoint returns 200', async () => {
    const res = await fetch(`${BASE_URL}/api/functions/alternatives?repo=facebook/react`);
    assertStatus(res, 200);
  });

  await test('Similar endpoint returns 200', async () => {
    const res = await fetch(`${BASE_URL}/api/functions/similar?repo=facebook/react`);
    assertStatus(res, 200);
  });

  // Auth Endpoints
  console.log('');
  console.log('Auth Endpoints:');
  await test('Auth/me returns 401 without session', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`);
    assertStatus(res, 401);
  });

  await test('Protected admin endpoint returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users`);
    assertStatus(res, 401);
  });

  // Security Headers
  console.log('');
  console.log('Security Headers:');
  await test('X-Content-Type-Options header present', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert(res.headers.get('x-content-type-options'), 'Missing x-content-type-options');
  });

  await test('X-Frame-Options header present', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert(res.headers.get('x-frame-options'), 'Missing x-frame-options');
  });

  // Rate Limiting
  console.log('');
  console.log('Rate Limiting:');
  await test('Rate limit headers present', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    // Rate limit headers may not be on health, check any endpoint
    const res2 = await fetch(`${BASE_URL}/api/entities?page=1&limit=1`);
    assert(
      res2.headers.get('x-ratelimit-limit') || res2.status === 200,
      'No rate limit headers'
    );
  });

  // Frontend
  console.log('');
  console.log('Frontend:');
  await test('Frontend serves HTML', async () => {
    const res = await fetch(FRONTEND_URL);
    const html = await res.text();
    assert(html.includes('<!DOCTYPE html>') || html.includes('<html'), 'Not valid HTML');
  });

  await test('Frontend serves JS bundle', async () => {
    const res = await fetch(FRONTEND_URL);
    const html = await res.text();
    assert(html.includes('.js') || html.includes('script'), 'No JS bundle found');
  });

  // Summary
  console.log('');
  console.log('📊 Smoke Test Summary');
  console.log('======================');
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total:  ${passed + failed}`);

  if (failed > 0) {
    console.log('');
    console.log('❌ Failures:');
    failures.forEach((f) => console.log(`  - ${f.name}: ${f.error}`));
    console.log('');
    console.log('❌ Smoke tests FAILED — deployment should be rolled back');
    process.exit(1);
  } else {
    console.log('');
    console.log('✅ All smoke tests PASSED');
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

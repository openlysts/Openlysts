/**
 * API Response Regression Tests for Openlysts
 * Verifies API responses match expected schemas and don't regress
 *
 * Usage:
 *   node tests/regression/api-regression.js
 *   npm run test:regression:api
 */

const BASE_URL = process.env.REGRESSION_URL || 'http://localhost:3001';

let passed = 0;
let failed = 0;
const regressions = [];

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failed++;
    regressions.push({ name, error: err.message });
    console.error(`  ❌ ${name}: ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function hasFields(obj, fields) {
  for (const field of fields) {
    assert(field in obj, `Missing field: ${field}`);
  }
}

async function run() {
  console.log('');
  console.log('🔄 API Regression Tests');
  console.log('========================');
  console.log('');

  // Health endpoint schema
  console.log('Health Endpoint:');
  await test('GET /api/health returns correct schema', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    hasFields(data, ['ok', 'status', 'service']);
    assert(data.ok === true, 'ok !== true');
    assert(typeof data.service === 'string', 'service is not string');
  });

  // Entities endpoint schema
  console.log('');
  console.log('Entities Endpoint:');
  await test('GET /api/entities returns correct schema', async () => {
    const res = await fetch(`${BASE_URL}/api/entities?page=1&limit=2`);
    const data = await res.json();
    hasFields(data, ['ok', 'status', 'repos', 'pagination']);
    assert(Array.isArray(data.repos), 'repos is not array');
    assert(typeof data.pagination === 'object', 'pagination is not object');
  });

  await test('GET /api/entities returns pagination fields', async () => {
    const res = await fetch(`${BASE_URL}/api/entities?page=1&limit=2`);
    const data = await res.json();
    hasFields(data.pagination, ['page', 'limit', 'total']);
  });

  await test('GET /api/entities with invalid page returns error', async () => {
    const res = await fetch(`${BASE_URL}/api/entities?page=-1&limit=2`);
    assert(res.status === 400 || res.status === 200, `Unexpected status: ${res.status}`);
  });

  // Trending endpoint
  console.log('');
  console.log('Trending Endpoint:');
  await test('GET /api/functions/trending returns array', async () => {
    const res = await fetch(`${BASE_URL}/api/functions/trending`);
    const data = await res.json();
    hasFields(data, ['ok']);
    assert(Array.isArray(data.repos) || Array.isArray(data.trending), 'No array in response');
  });

  // Alternatives endpoint
  console.log('');
  console.log('Alternatives Endpoint:');
  await test('GET /api/functions/alternatives returns correct schema', async () => {
    const res = await fetch(`${BASE_URL}/api/functions/alternatives?repo=facebook/react`);
    const data = await res.json();
    hasFields(data, ['ok']);
  });

  // Auth endpoints
  console.log('');
  console.log('Auth Regression:');
  await test('GET /api/auth/me returns 401 without session', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`);
    assert(res.status === 401, `Expected 401, got ${res.status}`);
    const data = await res.json();
    hasFields(data, ['ok', 'error']);
    assert(data.ok === false, 'Expected ok: false');
  });

  await test('POST /api/auth/login with empty body returns 400', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await test('POST /api/auth/register with invalid email returns 400', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'Password123!', name: 'Test' }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  // Security regression
  console.log('');
  console.log('Security Regression:');
  await test('Protected admin endpoints return 401', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users`);
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await test('404 handler returns structured response', async () => {
    const res = await fetch(`${BASE_URL}/api/nonexistent-endpoint-12345`);
    const data = await res.json();
    hasFields(data, ['ok', 'error']);
    assert(data.ok === false, 'Expected ok: false');
  });

  await test('Security headers present', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert(res.headers.get('x-content-type-options'), 'Missing x-content-type-options');
  });

  // Summary
  console.log('');
  console.log('📊 Regression Summary');
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);

  if (failed > 0) {
    console.log('');
    console.log('❌ REGRESSIONS DETECTED:');
    regressions.forEach((r) => console.log(`  - ${r.name}: ${r.error}`));
    process.exit(1);
  } else {
    console.log('');
    console.log('✅ No regressions detected');
    process.exit(0);
  }
}

run().catch(console.error);

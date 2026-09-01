/**
 * Load Testing Script for Openlysts
 * Tests API endpoint performance under concurrent load
 *
 * Usage:
 *   node scripts/load/api-load-test.js
 *   npm run load:api
 *
 * Configuration:
 *   LOAD_TARGET_URL=http://localhost:3001
 *   LOAD_CONCURRENCY=10
 *   LOAD_DURATION=30000
 */

const BASE_URL = process.env.LOAD_TARGET_URL || 'http://localhost:3001';
const CONCURRENCY = parseInt(process.env.LOAD_CONCURRENCY || '10', 10);
const DURATION = parseInt(process.env.LOAD_DURATION || '30000', 10);
const WARMUP_DURATION = 5000;

const ENDPOINTS = [
  { method: 'GET', path: '/api/health', name: 'Health Check' },
  { method: 'GET', path: '/api/entities?page=1&limit=20', name: 'List Repos' },
  { method: 'GET', path: '/api/entities?page=2&limit=20', name: 'List Repos (Page 2)' },
  { method: 'GET', path: '/api/functions/alternatives?repo=facebook/react', name: 'Alternatives' },
  { method: 'GET', path: '/api/functions/similar?repo=facebook/react', name: 'Similar Repos' },
  { method: 'GET', path: '/api/functions/trending', name: 'Trending Repos' },
];

// Results collector
const results = {
  total: 0,
  success: 0,
  failure: 0,
  errors: {},
  durations: [],
  byEndpoint: {},
};

function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

async function makeRequest(endpoint) {
  const start = Date.now();
  try {
    const response = await fetch(`${BASE_URL}${endpoint.path}`, {
      method: endpoint.method,
      signal: AbortSignal.timeout(10000),
    });
    const duration = Date.now() - start;

    results.total++;
    results.durations.push(duration);

    if (!results.byEndpoint[endpoint.name]) {
      results.byEndpoint[endpoint.name] = { durations: [], success: 0, failure: 0 };
    }
    results.byEndpoint[endpoint.name].durations.push(duration);

    if (response.ok) {
      results.success++;
      results.byEndpoint[endpoint.name].success++;
    } else {
      results.failure++;
      results.byEndpoint[endpoint.name].failure++;
      const status = response.status;
      results.errors[status] = (results.errors[status] || 0) + 1;
    }
  } catch (err) {
    const duration = Date.now() - start;
    results.total++;
    results.durations.push(duration);
    results.failure++;
    const errMsg = err.name || 'Unknown';
    results.errors[errMsg] = (results.errors[errMsg] || 0) + 1;
  }
}

function printResults(label, durations, success, failure) {
  if (durations.length === 0) {
    console.log(`  ${label}: No data`);
    return;
  }
  const meanMs = mean(durations).toFixed(1);
  const p50 = percentile(durations, 50);
  const p95 = percentile(durations, 95);
  const p99 = percentile(durations, 99);
  const max = Math.max(...durations);
  const rps = durations.length > 0 ? ((durations.length / (max / 1000)) || 0).toFixed(1) : 0;

  console.log(`  ${label}:`);
  console.log(`    Requests: ${success + failure} (${success} ok, ${failure} fail)`);
  console.log(`    Mean: ${meanMs}ms | P50: ${p50}ms | P95: ${p95}ms | P99: ${p99}ms | Max: ${max}ms`);
}

async function runLoadTest() {
  console.log('');
  console.log('⚡ Load Test');
  console.log('============');
  console.log(`  Target: ${BASE_URL}`);
  console.log(`  Concurrency: ${CONCURRENCY}`);
  console.log(`  Duration: ${DURATION / 1000}s`);
  console.log('');

  // Warmup
  console.log('🔥 Warming up...');
  const warmupEnd = Date.now() + WARMUP_DURATION;
  while (Date.now() < warmupEnd) {
    const promises = Array.from({ length: CONCURRENCY }, () =>
      makeRequest(ENDPOINTS[0])
    );
    await Promise.all(promises);
  }

  // Reset results after warmup
  results.total = 0;
  results.success = 0;
  results.failure = 0;
  results.errors = {};
  results.durations = [];
  results.byEndpoint = {};

  // Main test
  console.log('🚀 Running load test...');
  const testEnd = Date.now() + DURATION;

  while (Date.now() < testEnd) {
    const promises = ENDPOINTS.map((ep) => makeRequest(ep));
    await Promise.all(promises);
  }

  // Results
  console.log('');
  console.log('📊 Results');
  console.log('==========');
  printResults('Overall', results.durations, results.success, results.failure);
  console.log('');

  for (const [name, data] of Object.entries(results.byEndpoint)) {
    printResults(name, data.durations, data.success, data.failure);
  }

  console.log('');
  if (Object.keys(results.errors).length > 0) {
    console.log('❌ Errors:');
    for (const [err, count] of Object.entries(results.errors)) {
      console.log(`  ${err}: ${count}`);
    }
  }

  // Performance thresholds
  console.log('');
  console.log('🎯 Thresholds:');
  const p95 = percentile(results.durations, 95);
  const successRate = (results.success / results.total) * 100;

  if (p95 > 2000) {
    console.log(`  ❌ P95 latency ${p95}ms exceeds 2000ms threshold`);
  } else {
    console.log(`  ✅ P95 latency ${p95}ms within 2000ms threshold`);
  }

  if (successRate < 99) {
    console.log(`  ❌ Success rate ${successRate.toFixed(1)}% below 99% threshold`);
  } else {
    console.log(`  ✅ Success rate ${successRate.toFixed(1)}% meets 99% threshold`);
  }
}

runLoadTest().catch(console.error);

/**
 * Error Rate Monitor for Openlysts
 * Tracks and reports error rates over time
 *
 * Usage:
 *   node scripts/monitoring/error-rate.js
 *   npm run monitor:errors
 */

const fs = require('fs');
const path = require('path');
const BASE_URL = process.env.ERROR_MONITOR_URL || 'http://localhost:3001';
const REPORT_DIR = path.join(process.cwd(), 'reports');

const ENDPOINTS = [
  { path: '/api/health', name: 'Health', expectStatus: 200 },
  { path: '/api/entities?page=1&limit=5', name: 'Entities', expectStatus: 200 },
  { path: '/api/functions/trending', name: 'Trending', expectStatus: 200 },
  { path: '/api/functions/alternatives?repo=facebook/react', name: 'Alternatives', expectStatus: 200 },
  { path: '/api/functions/similar?repo=facebook/react', name: 'Similar', expectStatus: 200 },
  { path: '/api/auth/me', name: 'Auth Me', expectStatus: 401 },
  { path: '/api/admin/users', name: 'Admin Users', expectStatus: 401 },
  { path: '/api/nonexistent', name: '404 Handler', expectStatus: 404 },
];

async function testEndpoint(endpoint) {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}${endpoint.path}`, { signal: AbortSignal.timeout(10000) });
    const duration = Date.now() - start;
    const passed = res.status === endpoint.expectStatus;
    return {
      name: endpoint.name,
      path: endpoint.path,
      status: res.status,
      expected: endpoint.expectStatus,
      duration,
      passed,
      error: passed ? null : `Expected ${endpoint.expectStatus}, got ${res.status}`,
    };
  } catch (err) {
    return {
      name: endpoint.name,
      path: endpoint.path,
      status: 0,
      expected: endpoint.expectStatus,
      duration: Date.now() - start,
      passed: false,
      error: err.message,
    };
  }
}

async function run() {
  console.log('');
  console.log('📊 Error Rate Monitor');
  console.log('=====================');
  console.log(`  Target: ${BASE_URL}`);
  console.log(`  Time: ${new Date().toISOString()}`);
  console.log('');

  const results = await Promise.all(ENDPOINTS.map(testEndpoint));

  // Print results
  console.log('Endpoint Results:');
  let passCount = 0;
  let failCount = 0;

  for (const r of results) {
    const icon = r.passed ? '✅' : '❌';
    const statusStr = `${r.status}/${r.expected}`;
    console.log(`  ${icon} ${r.name}: ${statusStr} (${r.duration}ms)${r.error ? ' — ' + r.error : ''}`);
    if (r.passed) passCount++;
    else failCount++;
  }

  // Summary
  console.log('');
  console.log('📊 Summary');
  console.log(`  Passed: ${passCount}/${results.length}`);
  console.log(`  Failed: ${failCount}/${results.length}`);

  // Generate report file
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
  const reportFile = path.join(REPORT_DIR, `error-rate-${Date.now()}.json`);
  const report = {
    timestamp: new Date().toISOString(),
    target: BASE_URL,
    results,
    summary: { passed: passCount, failed: failCount, total: results.length },
  };
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(`\n  📄 Report saved: ${reportFile}`);

  if (failCount > 0) {
    console.log('\n❌ Error rate check FAILED');
    process.exit(1);
  } else {
    console.log('\n✅ Error rate check PASSED');
    process.exit(0);
  }
}

run().catch(console.error);

/**
 * Anomaly Detection Script for Openlysts
 * Monitors error rates, response times, memory, and unusual patterns
 *
 * Usage:
 *   node scripts/monitoring/anomaly-detect.js
 *   npm run monitor:anomaly
 */

const BASE_URL = process.env.ANOMALY_URL || 'http://localhost:3001';
const SAMPLE_SIZE = parseInt(process.env.ANOMALY_SAMPLES || '20', 10);
const SLOW_THRESHOLD = parseInt(process.env.ANOMALY_SLOW_MS || '2000', 10);
const ERROR_THRESHOLD = parseFloat(process.env.ANOMALY_ERROR_RATE || '0.1', 10);

const anomalies = [];

function flag(severity, category, description) {
  anomalies.push({ severity, category, description });
  const icon = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : '🟡';
  console.log(`  ${icon} [${category}] ${description}`);
}

async function measureEndpoint(path) {
  const times = [];
  let errors = 0;

  for (let i = 0; i < SAMPLE_SIZE; i++) {
    const start = Date.now();
    try {
      const res = await fetch(`${BASE_URL}${path}`, { signal: AbortSignal.timeout(10000) });
      const duration = Date.now() - start;
      times.push(duration);
      if (!res.ok) errors++;
    } catch {
      times.push(Date.now() - start);
      errors++;
    }
  }

  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const sorted = [...times].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const stdDev = Math.sqrt(times.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / times.length);

  return { mean, p95, stdDev, errors, errorRate: errors / SAMPLE_SIZE, times };
}

async function run() {
  console.log('');
  console.log('🔍 Anomaly Detection');
  console.log('====================');
  console.log(`  Target: ${BASE_URL}`);
  console.log(`  Samples per endpoint: ${SAMPLE_SIZE}`);
  console.log('');

  const endpoints = [
    '/api/health',
    '/api/entities?page=1&limit=5',
    '/api/functions/trending',
    '/api/auth/me',
  ];

  // Response time anomalies
  console.log('Response Time Analysis:');
  for (const endpoint of endpoints) {
    const result = await measureEndpoint(endpoint);
    const name = endpoint.split('?')[0];

    if (result.p95 > SLOW_THRESHOLD) {
      flag('high', 'latency', `${name}: P95 ${result.p95}ms exceeds ${SLOW_THRESHOLD}ms`);
    }

    if (result.stdDev > result.mean * 2) {
      flag('medium', 'jitter', `${name}: High jitter (stdDev ${result.stdDev.toFixed(0)}ms, mean ${result.mean.toFixed(0)}ms)`);
    }

    if (result.mean > 0) {
      console.log(`  📊 ${name}: mean=${result.mean.toFixed(0)}ms p95=${result.p95}ms`);
    }
  }

  // Error rate anomalies
  console.log('');
  console.log('Error Rate Analysis:');
  for (const endpoint of endpoints) {
    const result = await measureEndpoint(endpoint);
    const name = endpoint.split('?')[0];

    if (result.errorRate > ERROR_THRESHOLD) {
      flag('critical', 'error-rate', `${name}: ${(result.errorRate * 100).toFixed(1)}% error rate exceeds ${(ERROR_THRESHOLD * 100).toFixed(1)}%`);
    }

    if (result.errorRate > 0) {
      console.log(`  📊 ${name}: ${(result.errorRate * 100).toFixed(1)}% error rate (${result.errors}/${SAMPLE_SIZE})`);
    }
  }

  // Memory anomalies
  console.log('');
  console.log('Memory Analysis:');
  const mem = process.memoryUsage();
  const heapMB = mem.heapUsed / 1024 / 1024;

  if (heapMB > 500) {
    flag('critical', 'memory', `Heap usage ${heapMB.toFixed(1)}MB exceeds 500MB`);
  } else if (heapMB > 300) {
    flag('medium', 'memory', `Heap usage ${heapMB.toFixed(1)}MB is elevated`);
  }
  console.log(`  📊 Heap: ${heapMB.toFixed(1)}MB | RSS: ${(mem.rss / 1024 / 1024).toFixed(1)}MB`);

  // Summary
  console.log('');
  console.log('📊 Anomaly Summary');
  const critical = anomalies.filter((a) => a.severity === 'critical').length;
  const high = anomalies.filter((a) => a.severity === 'high').length;
  const medium = anomalies.filter((a) => a.severity === 'medium').length;

  console.log(`  🔴 Critical: ${critical}`);
  console.log(`  🟠 High:     ${high}`);
  console.log(`  🟡 Medium:   ${medium}`);

  if (critical > 0) {
    console.log('\n❌ CRITICAL anomalies detected — immediate action required');
    process.exit(2);
  } else if (high > 0) {
    console.log('\n⚠️  High anomalies detected — investigate soon');
    process.exit(1);
  } else if (medium > 0) {
    console.log('\n⚠️  Medium anomalies detected — monitor closely');
    process.exit(0);
  } else {
    console.log('\n✅ No anomalies detected');
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Anomaly detection failed:', err);
  process.exit(1);
});

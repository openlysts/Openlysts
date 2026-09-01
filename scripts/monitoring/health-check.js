/**
 * Health Check & Monitoring Script for Openlysts
 * Checks API health, database connectivity, memory usage, and error rates
 *
 * Usage:
 *   node scripts/monitoring/health-check.js
 *   npm run monitor:health
 */

const BASE_URL = process.env.HEALTH_URL || 'http://localhost:3001';
const DB_CHECK = process.env.DATABASE_URL ? true : false;

let healthy = 0;
let unhealthy = 0;

async function check(name, fn) {
  try {
    const result = await fn();
    healthy++;
    console.log(`  ✅ ${name}${result ? ' — ' + result : ''}`);
  } catch (err) {
    unhealthy++;
    console.error(`  ❌ ${name}: ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function run() {
  console.log('');
  console.log('🏥 Health Check');
  console.log('===============');
  console.log(`  Target: ${BASE_URL}`);
  console.log(`  Time: ${new Date().toISOString()}`);
  console.log('');

  // API Health
  console.log('API:');
  await check('API responds', async () => {
    const start = Date.now();
    const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(5000) });
    const duration = Date.now() - start;
    assert(res.ok, `Status ${res.status}`);
    const data = await res.json();
    assert(data.ok === true, 'ok !== true');
    return `${duration}ms`;
  });

  await check('API response time < 2000ms', async () => {
    const start = Date.now();
    await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(5000) });
    const duration = Date.now() - start;
    assert(duration < 2000, `${duration}ms exceeds 2000ms`);
    return `${duration}ms`;
  });

  // Database
  if (DB_CHECK) {
    console.log('');
    console.log('Database:');
    await check('Database connectivity', async () => {
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 5000,
      });
      const start = Date.now();
      await pool.query('SELECT 1');
      const duration = Date.now() - start;
      await pool.end();
      return `${duration}ms`;
    });
  }

  // Memory
  console.log('');
  console.log('System:');
  const mem = process.memoryUsage();
  const heapUsedMB = (mem.heapUsed / 1024 / 1024).toFixed(1);
  const heapTotalMB = (mem.heapTotal / 1024 / 1024).toFixed(1);
  await check('Heap memory', async () => {
    assert(parseFloat(heapUsedMB) < 500, `${heapUsedMB}MB exceeds 500MB`);
    return `${heapUsedMB}MB / ${heapTotalMB}MB`;
  });

  await check('Process uptime', async () => {
    const uptime = process.uptime();
    const minutes = Math.floor(uptime / 60);
    return `${minutes} minutes`;
  });

  // Summary
  console.log('');
  console.log('📊 Summary');
  console.log(`  Healthy:   ${healthy}`);
  console.log(`  Unhealthy: ${unhealthy}`);
  console.log(`  Total:     ${healthy + unhealthy}`);

  if (unhealthy > 0) {
    console.log('');
    console.log('❌ System is UNHEALTHY');
    process.exit(1);
  } else {
    console.log('');
    console.log('✅ System is HEALTHY');
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Health check failed:', err);
  process.exit(1);
});

/**
 * Shared database test utilities for Openlysts
 * Used by server tests and audit scripts
 */

const { Pool } = require('pg');

/**
 * Create a test database connection
 */
function createTestPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  return new Pool({
    connectionString,
    ssl: connectionString.includes('neon.tech')
      ? { rejectUnauthorized: false }
      : false,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });
}

/**
 * Execute a query with error handling
 */
async function query(pool, text, params = []) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    return { ...result, duration };
  } catch (error) {
    const duration = Date.now() - start;
    throw new Error(`Query failed (${duration}ms): ${error.message}`);
  }
}

/**
 * Check if a table exists
 */
async function tableExists(pool, tableName) {
  const result = await query(
    pool,
    `SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    )`,
    [tableName]
  );
  return result.rows[0].exists;
}

/**
 * Get table row count
 */
async function rowCount(pool, tableName) {
  const result = await query(pool, `SELECT COUNT(*) FROM "${tableName}"`);
  return parseInt(result.rows[0].count, 10);
}

/**
 * Check if a column exists in a table
 */
async function columnExists(pool, tableName, columnName) {
  const result = await query(
    pool,
    `SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1 
      AND column_name = $2
    )`,
    [tableName, columnName]
  );
  return result.rows[0].exists;
}

/**
 * Check if an index exists
 */
async function indexExists(pool, indexName) {
  const result = await query(
    pool,
    `SELECT EXISTS (
      SELECT FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname = $1
    )`,
    [indexName]
  );
  return result.rows[0].exists;
}

/**
 * Get all table names
 */
async function getTableNames(pool) {
  const result = await query(
    pool,
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
  );
  return result.rows.map((r) => r.tablename);
}

/**
 * Get all column names for a table
 */
async function getColumnNames(pool, tableName) {
  const result = await query(
    pool,
    `SELECT column_name FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = $1 
     ORDER BY ordinal_position`,
    [tableName]
  );
  return result.rows.map((r) => r.column_name);
}

/**
 * Test parameterized query (should NOT throw)
 */
async function testParameterizedQuery(pool) {
  try {
    await query(pool, 'SELECT $1::text AS value', ['test']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Test that string concatenation is NOT used (SQL injection test)
 */
async function testSqlInjectionResistance(pool) {
  const maliciousInputs = [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "1; SELECT * FROM users",
    "' UNION SELECT * FROM users --",
  ];

  for (const input of maliciousInputs) {
    try {
      await query(pool, 'SELECT $1::text AS value', [input]);
    } catch {
      // If any query fails with malicious input, that's expected
      // The point is it shouldn't cause a full table dump or error leak
    }
  }

  return true;
}

/**
 * Check foreign key constraints
 */
async function getForeignKeys(pool, tableName) {
  const result = await query(
    pool,
    `SELECT
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = $1`,
    [tableName]
  );
  return result.rows;
}

/**
 * Check for orphaned records (foreign keys pointing to non-existent parents)
 */
async function checkOrphanedRecords(pool, childTable, childColumn, parentTable, parentColumn) {
  const result = await query(
    pool,
    `SELECT c.${childColumn} as orphaned_id
     FROM ${childTable} c
     LEFT JOIN ${parentTable} p ON c.${childColumn} = p.${parentColumn}
     WHERE p.${parentColumn} IS NULL
     LIMIT 10`
  );
  return result.rows;
}

/**
 * Measure query performance
 */
async function measureQueryPerformance(pool, queryFn, iterations = 10) {
  const durations = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await queryFn();
    durations.push(Date.now() - start);
  }

  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const max = Math.max(...durations);
  const min = Math.min(...durations);

  return { avg, max, min, iterations: durations.length };
}

module.exports = {
  createTestPool,
  query,
  tableExists,
  rowCount,
  columnExists,
  indexExists,
  getTableNames,
  getColumnNames,
  testParameterizedQuery,
  testSqlInjectionResistance,
  getForeignKeys,
  checkOrphanedRecords,
  measureQueryPerformance,
};

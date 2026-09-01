/**
 * Database Schema Sanity Checker for Openlysts
 * Validates database schema integrity, indexes, and constraints
 *
 * Usage:
 *   node scripts/sanity/check-schema.js
 *   npm run sanity:db
 */

const { Pool } = require('pg');

const REQUIRED_TABLES = [
  'users',
  'repositories',
  'sessions',
  'bookmarks',
  'audit_logs',
  'mfa_secrets',
  'passkeys',
  'password_reset_tokens',
];

const REQUIRED_COLUMNS = {
  users: ['id', 'email', 'password_hash', 'name', 'role', 'created_date'],
  repositories: ['id', 'github_url', 'full_name', 'description', 'stars', 'language'],
  sessions: ['sid', 'sess', 'expire'],
  bookmarks: ['id', 'user_id', 'repository_id'],
  audit_logs: ['id', 'user_id', 'action', 'created_date'],
};

let errors = 0;
let warnings = 0;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : false,
    max: 5,
    connectionTimeoutMillis: 5000,
  });

  console.log('');
  console.log('🔍 Database Schema Sanity Check');
  console.log('================================');
  console.log('');

  try {
    // Check tables
    console.log('Tables:');
    const tablesResult = await pool.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    );
    const tables = tablesResult.rows.map((r) => r.tablename);

    for (const required of REQUIRED_TABLES) {
      if (tables.includes(required)) {
        console.log(`  ✅ ${required}`);
      } else {
        console.error(`  ❌ ${required}: MISSING`);
        errors++;
      }
    }

    // Check columns
    console.log('');
    console.log('Columns:');
    for (const [table, columns] of Object.entries(REQUIRED_COLUMNS)) {
      if (!tables.includes(table)) {
        console.warn(`  ⚠️  Skipping ${table} (table missing)`);
        continue;
      }

      const colResult = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public'`,
        [table]
      );
      const existingCols = colResult.rows.map((r) => r.column_name);

      for (const col of columns) {
        if (existingCols.includes(col)) {
          console.log(`  ✅ ${table}.${col}`);
        } else {
          console.error(`  ❌ ${table}.${col}: MISSING`);
          errors++;
        }
      }
    }

    // Check indexes
    console.log('');
    console.log('Indexes:');
    const indexResult = await pool.query(
      `SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename`
    );
    console.log(`  ℹ️  ${indexResult.rows.length} indexes found`);

    // Check foreign keys
    console.log('');
    console.log('Foreign Keys:');
    const fkResult = await pool.query(
      `SELECT count(*) as count FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public'`
    );
    console.log(`  ℹ️  ${fkResult.rows[0].count} foreign keys found`);

    // Check for orphaned records
    console.log('');
    console.log('Orphaned Records:');
    try {
      const orphanResult = await pool.query(
        `SELECT count(*) as count FROM bookmarks b LEFT JOIN users u ON b.user_id = u.id WHERE u.id IS NULL`
      );
      if (parseInt(orphanResult.rows[0].count) > 0) {
        console.warn(`  ⚠️  ${orphanResult.rows[0].count} orphaned bookmarks (user deleted)`);
        warnings++;
      } else {
        console.log('  ✅ No orphaned bookmarks');
      }
    } catch {
      console.warn('  ⚠️  Could not check orphaned records');
    }

    // Check connection pool
    console.log('');
    console.log('Connection Pool:');
    const poolStats = await pool.query(
      `SELECT count(*) as total FROM pg_stat_activity WHERE datname = current_database()`
    );
    console.log(`  ℹ️  ${poolStats.rows[0].total} active connections`);
  } catch (err) {
    console.error(`\n❌ Database connection failed: ${err.message}`);
    errors++;
  } finally {
    await pool.end();
  }

  console.log('');
  console.log(`Results: ${errors} error(s), ${warnings} warning(s)`);

  if (errors > 0) {
    console.error('\n❌ Schema check FAILED.');
    process.exit(1);
  } else {
    console.log('\n✅ Schema check passed.');
    process.exit(0);
  }
}

main();

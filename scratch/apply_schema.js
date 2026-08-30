import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function apply() {
  const client = await pool.connect();
  try {
    console.log('Adding is_pending to Repository...');
    try {
      await client.query(`ALTER TABLE "Repository" ADD COLUMN is_pending INTEGER DEFAULT 0;`);
      console.log('Success.');
    } catch (e) {
      if (e.code === '42701') console.log('Column is_pending already exists.');
      else throw e;
    }
    
    console.log('Creating SystemConfig table...');
    await client.query(`CREATE TABLE IF NOT EXISTS "SystemConfig" (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at TEXT
    );`);
    console.log('Success.');
    
    // Check tables
    const { rows } = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname='public';`);
    console.log('Tables:', rows.map(r => r.tablename));
    
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    client.release();
    pool.end();
  }
}

apply();

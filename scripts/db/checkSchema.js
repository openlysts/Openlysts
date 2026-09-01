import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function check() {
  const { rows } = await pool.query('SELECT column_name FROM information_schema.columns WHERE table_name = \'User\'');
  console.log('User columns:', rows.map(r => r.column_name));
  
  const tables = await pool.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'');
  console.log('Tables:', tables.rows.map(r => r.table_name));
  
  await pool.end();
}
check();

import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await pool.query('UPDATE "User" SET email_verified = 1 WHERE email = $1', ['test-user-2@openlysts.test']);
    console.log('Done!');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();

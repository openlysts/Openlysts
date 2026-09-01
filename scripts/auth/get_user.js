import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const res = await pool.query('SELECT id, email, role FROM "User" LIMIT 5');
    console.log(res.rows);
  } finally {
    await pool.end();
  }
}
run();

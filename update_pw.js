import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
dotenv.config();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  const password = await bcrypt.hash('Password123!', 10);
  await pool.query('UPDATE "User" SET password_hash = $1 WHERE email IN ($2, $3)', [password, 'sheenhatt@gmail.com', 'reviewzxone@gmail.com']);
  console.log("Updated passwords.");
  await pool.end();
}
run();

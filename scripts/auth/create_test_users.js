import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const password = await bcrypt.hash('Password123!', 10);
    const id = crypto.randomUUID();
    await pool.query(`
      INSERT INTO "User" (id, email, password_hash, name, role)
      VALUES ($1, $2, $3, 'Playwright Admin', 'ADMIN')
      ON CONFLICT (email) DO UPDATE SET password_hash = $3, role = 'ADMIN'
    `, [id, 'playwright_admin@test.com', password]);
    
    const id2 = crypto.randomUUID();
    await pool.query(`
      INSERT INTO "User" (id, email, password_hash, name, role)
      VALUES ($1, $2, $3, 'Playwright Target', 'USER')
      ON CONFLICT (email) DO UPDATE SET password_hash = $3
    `, [id2, 'playwright_target@test.com', password]);

    console.log("Created/Updated test users.");
  } finally {
    await pool.end();
  }
}
run();

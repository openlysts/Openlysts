import { pool } from './server/db/index.js';

async function main() {
  try {
    await pool.query(`ALTER TABLE "User" ADD COLUMN has_seen_tour INTEGER DEFAULT 0`);
    console.log("Column added");
  } catch (err) {
    console.log("Column might already exist or error:", err.message);
  }
  process.exit(0);
}

main();

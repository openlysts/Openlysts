import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';
const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    let r = await db.query(`SELECT count(*) FROM "Alternative" WHERE paid_tool_name = 'Proprietary SaaS'`);
    console.log("Count with Proprietary SaaS:", r.rows[0].count);
    let r2 = await db.query(`SELECT count(*) FROM "Alternative" WHERE paid_tool_name = 'Proprietary Tool'`);
    console.log("Count with Proprietary Tool:", r2.rows[0].count);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();

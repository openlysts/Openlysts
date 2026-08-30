import 'dotenv/config';
import { db } from '../server/db/index.js';

async function main() {
  const res = await db.query(`SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'User'`);
  console.log(res.rows);
  process.exit(0);
}

main();

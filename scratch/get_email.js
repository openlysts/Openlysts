import 'dotenv/config';
import { db } from '../server/db/index.js';

async function main() {
  const res = await db.query('SELECT email FROM "User" LIMIT 1');
  console.log(res.rows);
  process.exit(0);
}

main();

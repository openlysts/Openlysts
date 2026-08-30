import 'dotenv/config';
import { db } from '../server/db/index.js';

async function main() {
  const res = await db.query(`SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = '"User"'::regclass`);
  console.log(res.rows);
  process.exit(0);
}

main();

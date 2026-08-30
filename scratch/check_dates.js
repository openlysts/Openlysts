import 'dotenv/config';
import { db } from '../server/db/index.js';

async function main() {
  const { rows } = await db.query('SELECT email, role, created_date FROM "User"');
  console.log(rows);
  process.exit(0);
}

main();

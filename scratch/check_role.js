import 'dotenv/config';
import { db } from '../server/db/index.js';

async function main() {
  const res = await db.query('SELECT email, role FROM "User" WHERE email = $1', ['sheenhatt@gmail.com']);
  console.log(res.rows);
  process.exit(0);
}

main();

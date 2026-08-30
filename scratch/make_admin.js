import 'dotenv/config';
import { db } from '../server/db/index.js';

async function main() {
  await db.query('UPDATE "User" SET role = $1 WHERE email = $2', ['ADMIN', 'sheenhatt@gmail.com']);
  console.log('Role updated.');
  process.exit(0);
}

main();

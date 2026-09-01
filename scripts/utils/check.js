import { db } from './server/db/index.js';
async function check() {
  const { rows } = await db.query('SELECT email, settings FROM "User"');
  console.log(rows);
  process.exit(0);
}
check();

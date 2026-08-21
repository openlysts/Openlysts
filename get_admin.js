import './server/env.js';
import { db } from './server/db/index.js';
async function run() {
  try {
    const res = await db.query('SELECT email FROM "User" WHERE role=\'ADMIN\'');
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();

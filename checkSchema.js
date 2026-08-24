import { db } from './server/db/index.js';

async function run() {
  const res = await db.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Alternative'`);
  console.log(JSON.stringify(res.rows, null, 2));
  process.exit(0);
}
run();

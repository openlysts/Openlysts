import { db } from './server/db/index.js';
async function run() {
  await db.query('UPDATE "SystemConfig" SET value = $1 WHERE key = $2', [JSON.stringify({ locked: false }), 'INGESTION_LOCK']);
  console.log('Unlocked');
  process.exit(0);
}
run();

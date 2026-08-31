import { db } from './server/db/index.js';
async function run() {
  const { rows } = await db.query('SELECT status, repos_processed, error_log FROM "IngestionRun" ORDER BY started_at DESC LIMIT 5');
  console.log(rows);
  process.exit(0);
}
run();

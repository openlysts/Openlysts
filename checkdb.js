import { db } from './server/db/index.js';

async function run() {
  try {
    const r = await db.query('SELECT COUNT(*) FROM "Repository"');
    console.log("Count:", r.rows);
  } catch (e) {
    console.error('Error object:', e.message);
  } finally {
    process.exit(0);
  }
}

run();

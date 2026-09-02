import './server/env.js';
import { db } from './server/db/index.js';

async function clearSessions() {
  await db.query('TRUNCATE TABLE "session" CASCADE;');
  console.log('Sessions cleared!');
  process.exit(0);
}

clearSessions().catch(console.error);

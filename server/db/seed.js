import 'dotenv/config';
import { db } from './index.js';
import { initSchema } from './schema.js';

async function seed() {
  console.log('[DB] Running schema initialization...');
  await initSchema(db);
  console.log('[DB] Schema initialized successfully.');
  process.exit(0);
}

seed().catch(err => {
  console.error('[DB] Schema initialization failed:', err);
  process.exit(1);
});

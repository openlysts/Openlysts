import { db } from './server/db/index.js';

async function run() {
  try {
    const ids = ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'];
    await db.query('UPDATE "Repository" SET hidden = 1, updated_at = NOW() WHERE id = ANY($1::text[])', [ids]);
    console.log('SUCCESS');
  } catch(e) {
    console.error('ERROR:', e.message);
  }
  process.exit();
}

run();

import { db } from './server/db/index.js';

async function run() {
  try {
    await db.query('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0');
    await db.query('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS locked_until TEXT');
    console.log('Columns added successfully');
  } catch (error) {
    console.error('Error adding columns:', error);
  } finally {
    process.exit(0);
  }
}

run();

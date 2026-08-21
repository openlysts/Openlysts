import './server/env.js';
import { db } from './server/db/index.js';
import { hashPassword } from './server/auth/password.js';

async function run() {
  try {
    const hash = await hashPassword('Password123');
    await db.query('UPDATE "User" SET password_hash = $1 WHERE email = $2', [hash, 'admin@localhost']);
    console.log('Password updated successfully.');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();

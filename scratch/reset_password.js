import 'dotenv/config';
import { db } from '../server/db/index.js';
import bcrypt from 'bcryptjs';

async function main() {
  const hash = await bcrypt.hash('password123', 12);
  await db.query('UPDATE "User" SET password_hash = $1 WHERE email = $2', [hash, 'sheenhatt@gmail.com']);
  console.log('Password reset.');
  process.exit(0);
}

main();

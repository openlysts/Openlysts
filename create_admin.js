import './server/env.js';
import { db } from './server/db/index.js';
import bcrypt from 'bcryptjs';

async function main() {
  const hash = await bcrypt.hash('Password123!', 10);
  await db.query(`
    INSERT INTO "User" (id, email, password, name, role) 
    VALUES (gen_random_uuid(), 'admin@openlyst.com', $1, 'Super Admin', 'ADMIN') 
    ON CONFLICT (email) DO UPDATE SET password = $1, role = 'ADMIN'
  `, [hash]);
  console.log('Admin user created or updated.');
  process.exit(0);
}

main().catch(console.error);
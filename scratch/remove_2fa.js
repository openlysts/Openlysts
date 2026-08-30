import { config } from 'dotenv';
config({ path: '.env.local' });
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  await pool.query('UPDATE "User" SET totp_enabled = 0 WHERE email = $1', ['sheenhatt@gmail.com']);
  await pool.query('DELETE FROM "Passkey" WHERE user_id = (SELECT id FROM "User" WHERE email = $1)', ['sheenhatt@gmail.com']);
  console.log('Removed 2FA from sheenhatt@gmail.com');
  process.exit(0);
})();

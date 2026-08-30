import { config } from 'dotenv';
config({ path: '.env.local' });
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  const { rows } = await pool.query('SELECT email, name FROM "User"');
  console.log(rows);
  process.exit(0);
})();

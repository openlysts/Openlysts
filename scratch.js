import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_qFaRV2XzfS9W@ep-plain-band-aepvip8k-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
});

async function run() {
  const res = await pool.query('SELECT * FROM "User" WHERE email_normalized = $1', ['admin@openlysts.com']);
  console.log('User found:', res.rows.length);
  
  if (res.rows.length === 0) {
    console.log("Admin user does not exist in this Neon database. We need to create it!");
  } else if (res.rows[0].email_verified === 0) {
    console.log("Setting email_verified to 1...");
    await pool.query('UPDATE "User" SET email_verified = 1 WHERE email_normalized = $1', ['admin@openlysts.com']);
    console.log("Done.");
  } else {
    console.log("Admin is already verified.");
  }
  process.exit(0);
}

run().catch(console.error);

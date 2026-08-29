import { Client } from 'pg';
import 'dotenv/config';

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL + '?sslmode=require' });
  await client.connect();
  const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Repository'");
  console.log(res.rows);
  await client.end();
}
run();

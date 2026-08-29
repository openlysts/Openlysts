import { Client } from 'pg';

async function run() {
  const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_qFaRV2XzfS9W@ep-plain-band-aepvip8k-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require' });
  await client.connect();
  const runs = await client.query('SELECT * FROM "IngestionRun" ORDER BY started_at DESC LIMIT 5');
  console.log('Recent IngestionRuns:');
  runs.rows.forEach(r => console.log(`- ${r.started_at} | ${r.status} | Processed: ${r.repos_processed} | Added: ${r.repos_added} | Error: ${r.error_log}`));
  await client.end();
}

run().catch(console.error);

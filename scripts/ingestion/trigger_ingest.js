import { executeIngestion } from './server/functions/runIngestion.js';

async function run() {
  console.log('Starting ingestion manually...');
  try {
    const result = await executeIngestion();
    console.log('Ingestion finished:', result);
  } catch(e) {
    console.error('Failed:', e);
  }
  process.exit(0);
}

run();

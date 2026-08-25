import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

import { executeIngestion } from '../functions/runIngestion.js';

async function runBenchmark() {
  console.time('Ingestion Benchmark');
  try {
    const result = await executeIngestion();
    console.log('Result:', result);
  } catch (error) {
    console.error('Benchmark failed:', error);
  }
  console.timeEnd('Ingestion Benchmark');
  process.exit(0);
}

runBenchmark();

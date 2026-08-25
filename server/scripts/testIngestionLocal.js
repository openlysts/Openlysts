import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });

import { executeIngestion } from '../functions/runIngestion.js';

async function main() {
  console.time('Ingestion');
  const res = await executeIngestion();
  console.timeEnd('Ingestion');
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}
main();

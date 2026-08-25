import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });

import { scrapeTrending } from '../functions/scrapeTrending.js';

async function main() {
  console.time('Scrape');
  const res = await scrapeTrending();
  console.timeEnd('Scrape');
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}
main();

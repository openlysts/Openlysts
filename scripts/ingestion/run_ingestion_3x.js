import { executeIngestion } from './server/functions/runIngestion.js';
import { db } from './server/db/index.js';

// Remove token so we can test with anonymous rate limits
delete process.env.GITHUB_TOKEN;

async function test() {
  for (let i = 1; i <= 3; i++) {
    console.log(`\n\n=== RUN ${i} ===`);
    try {
      await executeIngestion();
      console.log(`Run ${i} completed successfully!`);
    } catch (e) {
      console.error(`Run ${i} failed:`, e);
    }
    // Wait a few seconds between runs
    if (i < 3) await new Promise(r => setTimeout(r, 5000));
  }
  // close pool
  await db.end();
  process.exit(0);
}

test();

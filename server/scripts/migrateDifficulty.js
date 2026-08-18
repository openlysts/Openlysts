import { db } from '../db/index.js';
import { entities } from '../services/entities.js';
import { autoClassifyDifficulty } from '../shared/openlyst.js';

async function migrate() {
  console.log('[MIGRATION] Starting difficulty migration...');
  const repos = await entities.Repository.list(null, 10000);
  
  let updated = 0;
  for (const repo of repos) {
    const newDifficulty = autoClassifyDifficulty(repo);
    if (repo.difficulty !== newDifficulty) {
      await entities.Repository.update(repo.id, { difficulty: newDifficulty });
      updated++;
    }
  }
  
  console.log(`[MIGRATION] Complete. Updated ${updated} repositories.`);
}

migrate().catch(console.error).finally(() => process.exit(0));

import { entities } from './server/services/entities.js';
import { autoClassifyDifficulty } from './server/shared/openlyst.js';

async function run() {
  const repos = await entities.Repository.list();
  console.log(`Found ${repos.length} repositories`);
  
  let updated = 0;
  for (const repo of repos) {
    const diff = autoClassifyDifficulty(repo);
    if (repo.difficulty !== diff) {
      await entities.Repository.update(repo.id, { difficulty: diff });
      updated++;
    }
  }
  
  console.log(`Updated ${updated} repositories`);
}

run().catch(console.error);

import { entities } from '../services/entities.js';
import { githubFetch, ingestRepoItem } from '../functions/runIngestion.js';

async function syncAlternativeRepos() {
  console.log('Fetching all alternatives...');
  const alts = await entities.Alternative.list();
  const repos = await entities.Repository.list();
  const repoSet = new Set(repos.map(r => r.full_name.toLowerCase()));
  
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.warn('WARN: GITHUB_TOKEN is not set. API rate limits will apply.');
  }

  const missingRepos = new Set();
  for (const alt of alts) {
    if (alt.free_tool_repo && !repoSet.has(alt.free_tool_repo.toLowerCase())) {
      missingRepos.add(alt.free_tool_repo);
    }
  }

  console.log(`Found ${missingRepos.size} unique repositories missing from DB. Starting sync...`);

  let count = 0;
  for (const repoFullName of missingRepos) {
    console.log(`Fetching ${repoFullName}...`);
    try {
      const url = `https://api.github.com/repos/${repoFullName}`;
      const repoItem = await githubFetch(url, token);
      await ingestRepoItem(repoItem, 'alternative');
      count++;
    } catch (err) {
      console.error(`Failed to fetch/ingest ${repoFullName}:`, err.message);
    }
    // Rate limit sleep buffer
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`Successfully synced ${count} repositories.`);
}

syncAlternativeRepos().catch(console.error);

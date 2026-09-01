import './server/env.js';
import { entities } from './server/services/entities.js';

async function run() {
  try {
    const repos = await entities.Repository.filter({ full_name: 'parlant/parlant' }, '-stars', 5);
    console.log(`Found ${repos.length} repositories.`);
    if (repos.length > 0) {
      console.log('First repo:', repos[0].full_name, repos[0].name);
    }
  } catch (e) {
    console.error('Error object:', e);
  } finally {
    process.exit(0);
  }
}

run();

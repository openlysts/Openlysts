import { ingestHackerNews } from '../functions/ingestHackerNews.js';
import { ingestAwesomeLists } from '../functions/ingestAwesomeLists.js';
import { ingestFeeds } from '../functions/ingestFeeds.js';

async function runTests() {
  console.log('--- Testing ingestHackerNews ---');
  try {
    const hnResult = await ingestHackerNews();
    console.log('HN Result:', hnResult);
  } catch (e) {
    console.error('HN Error:', e);
  }

  console.log('\n--- Testing ingestAwesomeLists ---');
  try {
    const alResult = await ingestAwesomeLists();
    console.log('AwesomeLists Result:', alResult);
  } catch (e) {
    console.error('AwesomeLists Error:', e);
  }

  console.log('\n--- Testing ingestFeeds ---');
  try {
    const fResult = await ingestFeeds();
    console.log('Feeds Result:', fResult);
  } catch (e) {
    console.error('Feeds Error:', e);
  }
  
  process.exit(0);
}

runTests();

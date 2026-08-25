import { executeIngestion } from '../functions/runIngestion.js';
import { ingestAlternatives } from '../functions/ingestAlternatives.js';

console.log('🚀 [Git-Ops] Starting fully automated, self-sufficient Edge Catalog sync...');

async function runGitOpsSync() {
  try {
    // 1. Fetch & Hydrate Alternatives (Zero-Cost Sync from GitHub raw markdown)
    console.log('\n--- 🔄 Phase 1: Hydrating Alternatives Catalog ---');
    await ingestAlternatives();

    // 2. Fetch & Hydrate Repositories (GitHub Search API -> Edge Catalog -> Neon DB Merge)
    console.log('\n--- 🔄 Phase 2: Hydrating Repositories Catalog & Smart Merge ---');
    await executeIngestion();

    console.log('\n⏳ Waiting 5000ms for catalogEngine to flush in-memory indices to disk...');
    // catalogEngine.js uses a 3000ms debounce to persist the JSON files.
    // We must wait for this to complete before the GitHub Action terminates.
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('✅ [Git-Ops] Edge Catalog successfully hydrated and flushed to disk.');
    process.exit(0);
  } catch (error) {
    console.error('❌ [Git-Ops] Critical failure during Edge Catalog sync:', error);
    process.exit(1);
  }
}

runGitOpsSync();

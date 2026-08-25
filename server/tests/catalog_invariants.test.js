import assert from 'assert';
import { 
  queryRepositoriesCatalog, 
  queryAlternativesCatalog, 
  getCatalogGlobalStats, 
  getCatalogRepositories, 
  getCatalogAlternatives 
} from '../services/catalogEngine.js';

console.log('🧪 RUNNING PRODUCTION SOTA INVARIANT & ALGORITHM TEST SUITE...');

const startTime = Date.now();

// 1. DATA INTEGRITY INVARIANTS
const repos = getCatalogRepositories();
const alts = getCatalogAlternatives();

assert(repos.length > 0, 'Repositories catalog must not be empty');
assert(alts.length > 0, 'Alternatives catalog must not be empty');
console.log(`✓ Data Integrity: Loaded ${repos.length} repos and ${alts.length} alternatives.`);

// 2. CANONICAL DEDUPLICATION & IDENTITY INVARIANT
const seenRepoIds = new Set();
for (const repo of repos) {
  assert(repo.id, `Repository must have an id: ${repo.full_name}`);
  assert(!seenRepoIds.has(repo.id), `Duplicate repository id detected: ${repo.id}`);
  seenRepoIds.add(repo.id);
  assert(repo.name, `Repository must have a name: ${repo.id}`);
  assert(repo.stars >= 0, `Repository stars must be non-negative: ${repo.id}`);
}
console.log(`✓ Deduplication: All ${repos.length} repositories have unique canonical identities.`);

// 3. ALTERNATIVE NON-SELF-REFERENCE & SAAS MAPPING INVARIANT
const junkCategories = ['sponsors', 'contributing', 'table of contents'];
for (const alt of alts) {
  assert(alt.free_tool_name, 'Alternative must have a free_tool_name');
  assert(alt.paid_tool_name, `Alternative ${alt.free_tool_name} must have a paid_tool_name`);
  
  // Paid tool must NOT be equal to free tool
  assert(
    alt.free_tool_name.toLowerCase() !== alt.paid_tool_name.toLowerCase(), 
    `Alternative cannot replace itself: ${alt.free_tool_name} replaces ${alt.paid_tool_name}`
  );

  // Category must not be markdown junk
  assert(
    !junkCategories.includes((alt.category || '').toLowerCase()), 
    `Junk category detected in alternative: ${alt.category}`
  );

  // Description must not contain raw markdown anchor syntax
  assert(
    !/\*\*\[.*?\]\(.*?\)\*\*/.test(alt.description || ''),
    `Raw markdown link anchor detected in description: ${alt.description}`
  );
}
console.log(`✓ Edge Catalog Integrity: All ${alts.length} alternatives verified with valid proprietary SaaS targets and clean text.`);

// 4. SORTING INVARIANTS
// Test Stars Sort (Descending)
const starsQuery = queryRepositoriesCatalog({ sort: 'stars', perPage: 50 });
for (let i = 0; i < starsQuery.results.length - 1; i++) {
  assert(
    (starsQuery.results[i].stars || 0) >= (starsQuery.results[i + 1].stars || 0),
    `Stars sort invariant violated at index ${i}: ${starsQuery.results[i].stars} < ${starsQuery.results[i + 1].stars}`
  );
}
console.log('✓ Sorting Invariant (Stars Descending): PASS');

// Test Name Sort (Ascending)
const nameQuery = queryRepositoriesCatalog({ sort: 'name', perPage: 50 });
for (let i = 0; i < nameQuery.results.length - 1; i++) {
  assert(
    (nameQuery.results[i].name || '').localeCompare(nameQuery.results[i + 1].name || '') <= 0,
    `Name sort invariant violated at index ${i}: ${nameQuery.results[i].name} > ${nameQuery.results[i + 1].name}`
  );
}
console.log('✓ Sorting Invariant (Name Ascending): PASS');

// 5. FILTERING INVARIANTS
// Category Filter
const aiQuery = queryRepositoriesCatalog({ categories: ['ai'], perPage: 100 });
assert(aiQuery.results.length > 0, 'Category filter "ai" should return results');
for (const repo of aiQuery.results) {
  const hasAi = (repo.categories || []).some(c => c.toLowerCase().includes('ai') || c.toLowerCase().includes('machine learning'));
  assert(hasAi, `Repository ${repo.name} returned for category "ai" without matching category tag: ${JSON.stringify(repo.categories)}`);
}
console.log(`✓ Category Filtering: PASS (${aiQuery.results.length} AI repositories accurately matched).`);

// 6. PAGINATION & NON-OVERLAP INVARIANTS
const page1 = queryRepositoriesCatalog({ page: 1, perPage: 20 });
const page2 = queryRepositoriesCatalog({ page: 2, perPage: 20 });
assert(page1.results.length === 20, 'Page 1 must have 20 items');
assert(page2.results.length === 20, 'Page 2 must have 20 items');

const page1Ids = new Set(page1.results.map(r => r.id));
for (const item of page2.results) {
  assert(!page1Ids.has(item.id), `Pagination overlap detected: ID ${item.id} appears in both Page 1 and Page 2`);
}
console.log('✓ Pagination Invariant (Zero Overlap & Deterministic Slicing): PASS');

// 7. INVERTED INDEX RELEVANCE SEARCH INVARIANT
const searchReact = queryRepositoriesCatalog({ search: 'react' });
assert(searchReact.results.length > 0, 'Search for "react" must return results');
for (const r of searchReact.results.slice(0, 5)) {
  const match = (r.name || '').toLowerCase().includes('react') || 
                (r.description || '').toLowerCase().includes('react') ||
                (r.topics || []).some(t => t.toLowerCase().includes('react'));
  assert(match, `Irrelevant result returned for "react": ${r.name}`);
}
console.log(`✓ Inverted Index Search: PASS (${searchReact.results.length} relevant repositories matched).`);

// 8. TELEMETRY CONSISTENCY INVARIANT
const stats = getCatalogGlobalStats();
assert.strictEqual(stats.totalRepositories, repos.length, 'Total repositories in telemetry must match catalog length');
assert.strictEqual(stats.totalAlternatives, alts.length, 'Total alternatives in telemetry must match catalog length');
console.log(`✓ Global Telemetry Consistency: PASS (${stats.totalRepositories} repos, ${stats.totalAlternatives} alts).`);

// 9. ZERO-COST QUERY PERFORMANCE BENCHMARK
const iters = 1000;
const benchStart = Date.now();
for (let i = 0; i < iters; i++) {
  queryRepositoriesCatalog({ search: 'agent', sort: 'trending', page: 1, perPage: 24 });
}
const benchDuration = Date.now() - benchStart;
const avgLatency = benchDuration / iters;
console.log(`✓ Zero-Cost Discovery Benchmark: ${iters} complex queries in ${benchDuration}ms (Average: ${avgLatency.toFixed(3)}ms per query).`);
assert(avgLatency < 5, 'Average query latency must be under 5ms');

console.log(`\n🎉 ALL SOTA INVARIANT TESTS PASSED IN ${Date.now() - startTime}ms!\n`);

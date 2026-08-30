import { executeIngestion } from './server/functions/runIngestion.js';
import { db } from './server/db/index.js';
import fs from 'fs';

// Mock fetch globally
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  if (url.includes('api.github.com/search/repositories')) {
    console.log(`[MOCK FETCH] ${url}`);
    
    // Simulate valid response
    const mockItems = [];
    for (let i = 0; i < 100; i++) {
      mockItems.push({
        id: Math.floor(Math.random() * 10000000),
        full_name: `mock-owner/mock-repo-${Math.random().toString(36).substring(7)}`,
        created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
        stargazers_count: 150 + i,
        owner: { login: 'mock-owner', avatar_url: '' },
        description: 'Mock repo',
        html_url: 'https://github.com/mock/mock',
        topics: ['mock'],
        updated_at: new Date().toISOString()
      });
    }
    
    return {
      ok: true,
      status: 200,
      headers: { get: () => '100' },
      json: async () => ({
        total_count: 10000,
        items: mockItems
      })
    };
  }
  
  if (url.includes('github.com/trending')) {
    return {
      ok: true,
      status: 200,
      text: async () => '<html><body><article class="Box-row"><h2 class="h3"><a href="/mock/trending1"></a></h2></article></body></html>'
    };
  }
  
  if (url.includes('api.github.com/repos/mock/trending1')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        id: 9999999,
        full_name: 'mock/trending1',
        created_at: new Date().toISOString(),
        stargazers_count: 500,
        owner: { login: 'mock', avatar_url: '' },
        updated_at: new Date().toISOString()
      })
    };
  }
  
  // Return empty array for HackerNews/etc
  if (url.includes('hacker-news')) {
    return { ok: true, json: async () => [] };
  }
  if (url.includes('awesome-')) {
    return { ok: true, text: async () => '' };
  }

  return originalFetch(url, options);
};

// Ensure token is present so it attempts auth logic but uses mock
process.env.GITHUB_TOKEN = 'mock-token';

async function test() {
  for (let i = 1; i <= 3; i++) {
    console.log(`\n\n=== RUN ${i} ===`);
    try {
      const res = await executeIngestion();
      console.log(`Run ${i} completed! Result:`, res);
      
      // Verify DB state
      const { rows } = await db.query('SELECT current_page, query_string FROM "DiscoveryQuery" LIMIT 1');
      console.log(`[DB STATE] DiscoveryQuery:`, rows[0]);
      
    } catch (e) {
      console.error(`Run ${i} failed:`, e);
    }
  }
  await db.end();
  process.exit(0);
}

test();

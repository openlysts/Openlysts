/**
 * ingestAwesomeLists.js
 * Parses a curated set of "awesome-*" GitHub README lists to extract
 * the best-of-best open source projects. These are human-curated lists with
 * high editorial standards — perfect signal-to-noise ratio for quality tools.
 */

import { ingestRepoItem } from './runIngestion.js';
import { entities } from '../services/entities.js';
import { db } from '../db/index.js';

// Trusted, continuously-updated, high-signal awesome lists
// Each entry = { url: raw README URL, category: category hint }
const AWESOME_LISTS = [
  {
    url: 'https://raw.githubusercontent.com/RunaCapital/awesome-oss-alternatives/master/README.md',
    category: 'Open Source Alternatives',
  },
  {
    url: 'https://raw.githubusercontent.com/awesome-selfhosted/awesome-selfhosted/master/README.md',
    category: 'Self-Hosted',
  },
  {
    url: 'https://raw.githubusercontent.com/sindresorhus/awesome/main/readme.md',
    category: 'Developer Tools',
  },
  {
    url: 'https://raw.githubusercontent.com/vinta/awesome-python/master/README.md',
    category: 'Python',
  },
  {
    url: 'https://raw.githubusercontent.com/sorrycc/awesome-javascript/master/README.md',
    category: 'JavaScript',
  },
  {
    url: 'https://raw.githubusercontent.com/avelino/awesome-go/main/README.md',
    category: 'Go',
  },
  {
    url: 'https://raw.githubusercontent.com/rust-unofficial/awesome-rust/main/README.md',
    category: 'Rust',
  },
  {
    url: 'https://raw.githubusercontent.com/josephmisiti/awesome-machine-learning/master/README.md',
    category: 'Machine Learning',
  },
  {
    url: 'https://raw.githubusercontent.com/eugeneyan/open-llms/main/README.md',
    category: 'LLMs',
  },
  {
    url: 'https://raw.githubusercontent.com/Hannibal046/Awesome-LLM/main/README.md',
    category: 'LLMs',
  },
  {
    url: 'https://raw.githubusercontent.com/e2b-dev/awesome-ai-agents/main/README.md',
    category: 'AI Agents',
  },
];

const GITHUB_REPO_RE = /github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/g;
// Paths that are not repo roots
const EXCLUDED_PATHS = new Set(['releases', 'issues', 'pulls', 'wiki', 'blob', 'tree', 'commit', 'compare', 'raw', 'actions', 'packages', 'security', 'settings', 'graphs', 'network']);

function extractReposFromMarkdown(text, categoryHint) {
  const found = new Map();
  let match;
  while ((match = GITHUB_REPO_RE.exec(text)) !== null) {
    const owner = match[1];
    let name = match[2].replace(/\.git$/, '').replace(/[)>\]"'`]+$/, '');
    if (EXCLUDED_PATHS.has(name.toLowerCase())) continue;
    if (owner === 'topics' || owner === 'search') continue; // Skip GitHub UI links
    const key = `${owner}/${name}`.toLowerCase();
    if (!found.has(key)) {
      found.set(key, { owner, name, full_name: `${owner}/${name}`, category: categoryHint });
    }
  }
  return Array.from(found.values());
}

async function fetchMarkdown(url) {
  const res = await fetch(url, {
    headers: { 'Accept': 'text/plain', 'User-Agent': 'Openlysts-Discovery-Engine' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export async function ingestAwesomeLists() {
  console.log('[AwesomeLists] Starting awesome lists ingestion...');

  // 1. Fetch all awesome list markdowns in parallel
  const fetchResults = await Promise.allSettled(
    AWESOME_LISTS.map(async (list) => {
      const text = await fetchMarkdown(list.url);
      return { text, category: list.category };
    })
  );

  // 2. Extract all unique repos across all lists
  const repoMap = new Map();
  for (const result of fetchResults) {
    if (result.status !== 'fulfilled') {
      console.warn('[AwesomeLists] Failed to fetch a list:', result.reason?.message);
      continue;
    }
    const repos = extractReposFromMarkdown(result.value.text, result.value.category);
    for (const r of repos) {
      const key = r.full_name.toLowerCase();
      if (!repoMap.has(key)) {
        repoMap.set(key, { ...r, listCount: 1 });
      } else {
        // Multi-list appearance = higher signal / authority
        repoMap.get(key).listCount++;
      }
    }
  }

  console.log(`[AwesomeLists] Found ${repoMap.size} unique repos across awesome lists.`);

  // 3. Filter: only ingest repos appearing in lists (all are quality-curated)
  //    Sort by multi-list appearances first for quality-bias
  const repoList = Array.from(repoMap.values())
    .sort((a, b) => b.listCount - a.listCount);

  // 4. Load existing repos for dedup
  const existingMap = new Map();
  try {
    const { rows } = await db.query('SELECT id, github_id, full_name, hidden, featured FROM "Repository"');
    for (const r of rows) {
      if (r.github_id) existingMap.set(String(r.github_id), r);
      if (r.full_name) existingMap.set(r.full_name.toLowerCase(), r);
    }
  } catch (e) {
    console.warn('[AwesomeLists] Could not fetch existing repos from DB:', e.message);
  }

  // 5. Ingest in batches — respect GitHub rate limits
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const BATCH_SIZE = 8; // conservative for rate limits
  const processedBatch = [];
  let successCount = 0;

  for (let i = 0; i < repoList.length; i += BATCH_SIZE) {
    const chunk = repoList.slice(i, i + BATCH_SIZE);
    await Promise.all(chunk.map(async (r) => {
      try {
        const headers = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'Openlysts-Discovery-Engine' };
        if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
        const ghRes = await fetch(`https://api.github.com/repos/${r.owner}/${r.name}`, {
          headers,
          signal: AbortSignal.timeout(10000),
        });
        if (!ghRes.ok) return; // 404 (deleted/private), rate-limit, etc.
        const ghData = await ghRes.json();
        if (!ghData.full_name || ghData.private) return;

        const result = await ingestRepoItem(ghData, r.category, existingMap, new Map());
        if (result?.repoData) {
          // Multi-list repos get an authority boost
          result.repoData.authority_score = (result.repoData.authority_score || 0) + (r.listCount * 5);
          result.repoData.source_type = 'github';
        }
        processedBatch.push(result);
        successCount++;
      } catch (e) {
        // Silently handle individual failures
      }
    }));

    // Small delay every batch to respect secondary rate limits
    if (i + BATCH_SIZE < repoList.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // 6. Persist batch to DB
  if (processedBatch.length > 0) {
    try {
      await entities.Repository.bulkUpsert(processedBatch.map(p => p.repoData));
      await entities.MetricSnapshot.bulkCreate(processedBatch.map(p => p.snapshotData));
    } catch (e) {
      console.warn('[AwesomeLists] DB batch upsert failed:', e.message);
    }
  }

  console.log(`[AwesomeLists] Successfully ingested ${successCount} repos from awesome lists.`);
  return { success: true, count: successCount };
}

/**
 * ingestFeeds.js
 * Ingests open-source projects from trusted RSS feeds:
 * - Reddit r/selfhosted, r/opensource
 * - No external RSS parser needed — uses native fetch + lightweight XML regex extraction.
 * 
 * Strategy: extract GitHub repo links from post titles/descriptions, ingest the best.
 */

import { ingestRepoItem } from './runIngestion.js';
import { entities } from '../services/entities.js';
import { db } from '../db/index.js';
import { tokenRotation } from '../services/tokenRotation.js';

const RSS_FEEDS = [
  {
    url: 'https://www.reddit.com/r/selfhosted/top/.rss?t=week&limit=50',
    category: 'Self-Hosted',
  },
  {
    url: 'https://www.reddit.com/r/opensource/top/.rss?t=week&limit=50',
    category: 'Open Source',
  },
  {
    url: 'https://www.reddit.com/r/devops/top/.rss?t=week&limit=50',
    category: 'DevOps',
  },
  {
    url: 'https://www.reddit.com/r/MachineLearning/top/.rss?t=week&limit=50',
    category: 'Machine Learning',
  },
];

const GITHUB_REPO_RE = /github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/g;
const EXCLUDED_PATHS = new Set(['releases', 'issues', 'pulls', 'wiki', 'blob', 'tree', 'commit', 'compare', 'raw', 'topics', 'actions', 'packages']);

function extractGitHubRepos(text, categoryHint) {
  const found = new Map();
  let match;
  while ((match = GITHUB_REPO_RE.exec(text)) !== null) {
    const owner = match[1];
    let name = match[2].replace(/\.git$/, '').replace(/[)>\]"'`\s]+$/, '');
    if (!name || EXCLUDED_PATHS.has(name.toLowerCase())) continue;
    if (owner === 'topics' || owner === 'search') continue;
    const key = `${owner}/${name}`.toLowerCase();
    if (!found.has(key)) {
      found.set(key, { owner, name, full_name: `${owner}/${name}`, category: categoryHint });
    }
  }
  return Array.from(found.values());
}

async function fetchFeed(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Openlysts-Discovery-Engine/1.0',
      'Accept': 'application/rss+xml, application/atom+xml, text/xml',
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// Lightweight XML content extraction — extracts text from <content>, <title>, <link>
function extractTextFromFeed(xml) {
  const textChunks = [];
  // Extract from <title>, <content:encoded>, <description>
  const patterns = [/<title[^>]*>([\s\S]*?)<\/title>/gi, /<content[^>]*>([\s\S]*?)<\/content>/gi, /<description[^>]*>([\s\S]*?)<\/description>/gi, /<link[^>]*>([\s\S]*?)<\/link>/gi];
  for (const pat of patterns) {
    let m;
    while ((m = pat.exec(xml)) !== null) {
      // Decode HTML entities and CDATA
      const raw = m[1]
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"');
      textChunks.push(raw);
    }
  }
  return textChunks.join(' ');
}

export async function ingestFeeds() {
  console.log('[Feeds] Starting RSS feed ingestion...');

  // 1. Fetch all feeds in parallel
  const fetchResults = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      const xml = await fetchFeed(feed.url);
      return { xml, category: feed.category };
    })
  );

  // 2. Extract GitHub repos from feed content
  const repoMap = new Map();
  for (const result of fetchResults) {
    if (result.status !== 'fulfilled') {
      console.warn('[Feeds] Failed to fetch a feed:', result.reason?.message);
      continue;
    }
    const text = extractTextFromFeed(result.value.xml);
    const repos = extractGitHubRepos(text, result.value.category);
    for (const r of repos) {
      const key = r.full_name.toLowerCase();
      if (!repoMap.has(key)) {
        repoMap.set(key, { ...r, mentions: 1 });
      } else {
        repoMap.get(key).mentions++;
      }
    }
  }

  console.log(`[Feeds] Found ${repoMap.size} unique repos in RSS feeds.`);
  if (repoMap.size === 0) return { success: true, count: 0 };

  // 3. Load existing repos for dedup
  const existingMap = new Map();
  try {
    const { rows } = await db.query('SELECT id, github_id, full_name, hidden, featured FROM "Repository"');
    for (const r of rows) {
      if (r.github_id) existingMap.set(String(r.github_id), r);
      if (r.full_name) existingMap.set(r.full_name.toLowerCase(), r);
    }
  } catch (e) {
    console.warn('[Feeds] Could not fetch existing repos from DB:', e.message);
  }

  // 4. Ingest in small batches
  const BATCH_SIZE = 6;
  const repoList = Array.from(repoMap.values()).sort((a, b) => b.mentions - a.mentions).slice(0, 24);
  const processedBatch = [];
  let successCount = 0;

  for (let i = 0; i < repoList.length; i += BATCH_SIZE) {
    const chunk = repoList.slice(i, i + BATCH_SIZE);
    await Promise.all(chunk.map(async (r) => {
      try {
        const tokenResult = tokenRotation.getToken();
        const ghToken = tokenResult?.token || process.env.GITHUB_TOKEN || '';
        const headers = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'Openlysts-Discovery-Engine' };
        if (ghToken) headers['Authorization'] = `Bearer ${ghToken}`;
        const ghRes = await fetch(`https://api.github.com/repos/${r.owner}/${r.name}`, {
          headers,
          signal: AbortSignal.timeout(10000),
        });
        if (!ghRes.ok) return;
        const ghData = await ghRes.json();
        if (!ghData.full_name || ghData.private) return;

        const result = await ingestRepoItem(ghData, r.category, existingMap, new Map());
        if (result?.repoData) {
          result.repoData.authority_score = (result.repoData.authority_score || 0) + (r.mentions * 3);
          result.repoData.source_type = 'github';
        }
        processedBatch.push(result);
        successCount++;
      } catch (e) {
        // Silently handle individual failures (rate limits, private repos)
      }
    }));

    if (i + BATCH_SIZE < repoList.length) {
      await new Promise(r => setTimeout(r, 400));
    }
  }

  // 5. Persist to DB
  if (processedBatch.length > 0) {
    try {
      await entities.Repository.bulkUpsert(processedBatch.map(p => p.repoData));
      await entities.MetricSnapshot.bulkCreate(processedBatch.map(p => p.snapshotData));
    } catch (e) {
      console.warn('[Feeds] DB batch upsert failed:', e.message);
    }
  }

  console.log(`[Feeds] Successfully ingested ${successCount} repos from RSS feeds.`);
  return { success: true, count: successCount };
}

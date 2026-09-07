/**
 * ingestHackerNews.js
 * Fetches top Hacker News stories + ShowHN posts, extracts GitHub repo links,
 * ingests them with an HN-sourced authority boost. Uses the official HN Firebase REST API.
 */

import { ingestRepoItem } from './runIngestion.js';
import { entities } from '../services/entities.js';
import { db } from '../db/index.js';
import { tokenRotation } from '../services/tokenRotation.js';

const HN_API = 'https://hacker-news.firebaseio.com/v0';
const MAX_STORIES = 200; // top + show combined
const GITHUB_REPO_RE = /github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/;
const BATCH_CONCURRENCY = 10;

async function hnFetch(url) {
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`HN API ${res.status}: ${url}`);
  return res.json();
}

function extractGitHubRepo(url) {
  if (!url) return null;
  const m = url.match(GITHUB_REPO_RE);
  if (!m) return null;
  const owner = m[1];
  let name = m[2].replace(/\.git$/, '');
  // Exclude special paths that aren't repos (e.g. /releases, /issues)
  if (['releases', 'issues', 'pulls', 'wiki', 'blob', 'tree', 'commit', 'compare'].includes(name.toLowerCase())) return null;
  return { owner, name, full_name: `${owner}/${name}` };
}

async function fetchStoryBatch(ids) {
  const results = [];
  for (let i = 0; i < ids.length; i += BATCH_CONCURRENCY) {
    const chunk = ids.slice(i, i + BATCH_CONCURRENCY);
    const stories = await Promise.all(
      chunk.map(async (id) => {
        try {
          return await hnFetch(`${HN_API}/item/${id}.json`);
        } catch {
          return null;
        }
      })
    );
    results.push(...stories.filter(Boolean));
  }
  return results;
}

export async function ingestHackerNews() {
  console.log('[HN] Starting Hacker News ingestion...');

  // 1. Fetch top stories + Show HN stories (asynchronously)
  let topIds = [], showIds = [];
  try {
    [topIds, showIds] = await Promise.all([
      hnFetch(`${HN_API}/topstories.json`),
      hnFetch(`${HN_API}/showstories.json`),
    ]);
  } catch (e) {
    console.warn('[HN] Failed to fetch story lists:', e.message);
    return { success: false, count: 0 };
  }

  // Take top N from each list
  const allIds = [...new Set([...topIds.slice(0, 100), ...showIds.slice(0, 100)])];

  // 2. Fetch story details in batches
  const stories = await fetchStoryBatch(allIds.slice(0, MAX_STORIES));

  // 3. Extract unique GitHub repos from story URLs + title matches
  const repoMap = new Map();
  for (const story of stories) {
    if (!story || story.dead || story.deleted) continue;
    const repo = extractGitHubRepo(story.url);
    if (!repo) continue;
    const key = repo.full_name.toLowerCase();
    if (!repoMap.has(key)) {
      repoMap.set(key, {
        ...repo,
        score: story.score || 0,
        comments: story.descendants || 0,
        hn_url: `https://news.ycombinator.com/item?id=${story.id}`,
      });
    } else {
      // Accumulate scores for repos mentioned multiple times
      repoMap.get(key).score += story.score || 0;
    }
  }

  console.log(`[HN] Found ${repoMap.size} unique GitHub repos in HN stories.`);
  if (repoMap.size === 0) return { success: true, count: 0 };

  // 4. Load existing repo metadata for dedup
  const existingMap = new Map();
  try {
    const { rows } = await db.query('SELECT id, github_id, full_name, hidden, featured FROM "Repository"');
    for (const r of rows) {
      if (r.github_id) existingMap.set(String(r.github_id), r);
      if (r.full_name) existingMap.set(r.full_name.toLowerCase(), r);
    }
  } catch (e) {
    console.warn('[HN] Could not fetch existing repos from DB:', e.message);
  }

  // 5. Ingest repos via GitHub API + enrich with HN score
  const processedBatch = [];
  let successCount = 0;

  const repoList = Array.from(repoMap.values()).slice(0, 24);
  for (let i = 0; i < repoList.length; i += BATCH_CONCURRENCY) {
    const chunk = repoList.slice(i, i + BATCH_CONCURRENCY);
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
        if (!ghData.full_name) return;

        const result = await ingestRepoItem(ghData, 'Trending', existingMap, new Map());
        // Boost authority_score based on HN score
        if (result?.repoData) {
          result.repoData.authority_score = (result.repoData.authority_score || 0) + Math.min(50, Math.floor(r.score / 10));
          result.repoData.source_type = 'github';
        }
        processedBatch.push(result);
        successCount++;
      } catch (e) {
        // Silently handle individual repo failures (rate limits, private repos, etc.)
      }
    }));
  }

  if (processedBatch.length > 0) {
    try {
      await entities.Repository.bulkUpsert(processedBatch.map(p => p.repoData));
      await entities.MetricSnapshot.bulkCreate(processedBatch.map(p => p.snapshotData));
    } catch (e) {
      console.warn('[HN] DB batch upsert failed:', e.message);
    }
  }

  console.log(`[HN] Successfully ingested ${successCount} repos from Hacker News.`);
  return { success: true, count: successCount };
}

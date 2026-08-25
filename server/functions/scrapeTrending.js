import * as cheerio from 'cheerio';
import { fetchRepoWithFallback, ingestRepoItem } from './runIngestion.js';
import { entities } from '../services/entities.js';
import { db } from '../db/index.js';

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export async function scrapeTrending() {
  const trendingUrls = [
    'https://github.com/trending',
    'https://github.com/trending/javascript',
    'https://github.com/trending/typescript',
    'https://github.com/trending/python',
    'https://github.com/trending/rust',
    'https://github.com/trending/go'
  ];

  const reposToFetch = new Set();

  await Promise.all(trendingUrls.map(async (url) => {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'text/html'
        }
      });
      if (!res.ok) return;
      const html = await res.text();
      const $ = cheerio.load(html);

      $('article.Box-row h2.h3 a').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
          reposToFetch.add(href.substring(1)); // strip leading slash
        }
      });
    } catch (e) {
      console.warn(`[TRENDING] Failed to scrape ${url}:`, e.message);
    }
  }));

  console.log(`[TRENDING] Found ${reposToFetch.size} unique trending repositories.`);

  const repoMap = new Map();
  try {
    const { rows: existingRows } = await db.query('SELECT id, github_id, full_name, hidden, featured FROM "Repository"');
    for (const r of existingRows) {
      if (r.github_id) repoMap.set(String(r.github_id), r);
      if (r.full_name) repoMap.set(r.full_name.toLowerCase(), r);
    }
  } catch (e) {}

  const snapshotMap = new Map();
  try {
    const { rows: existingSnapshots } = await db.query(
      'SELECT repository_id, stars, snapshot_date FROM "MetricSnapshot" ORDER BY snapshot_date DESC LIMIT 2000'
    );
    for (const s of existingSnapshots) {
      if (!snapshotMap.has(s.repository_id)) snapshotMap.set(s.repository_id, []);
      if (snapshotMap.get(s.repository_id).length < 30) {
        snapshotMap.get(s.repository_id).push(s);
      }
    }
  } catch (e) {}

  const processedBatch = [];
  let successCount = 0;
  
  const repoList = Array.from(reposToFetch);
  const chunks = chunkArray(repoList, 20); // 20 concurrent requests

  for (const chunk of chunks) {
    await Promise.all(chunk.map(async (fullName) => {
      try {
        const [owner, name] = fullName.split('/');
        const item = await fetchRepoWithFallback(owner, name, process.env.GITHUB_TOKEN);
        if (item && item.full_name) {
          const res = await ingestRepoItem(item, 'Trending', repoMap, snapshotMap);
          processedBatch.push(res);
          successCount++;
        }
      } catch (e) {
        console.warn(`[TRENDING] Failed to ingest ${fullName}:`, e.message);
      }
    }));
  }

  if (processedBatch.length > 0) {
    try {
      await entities.Repository.bulkUpsert(processedBatch.map(p => p.repoData));
      await entities.MetricSnapshot.bulkCreate(processedBatch.map(p => p.snapshotData));
    } catch (e) {
      console.warn(`[TRENDING] DB batch upsert failed:`, e.message);
    }
  }

  console.log(`[TRENDING] Successfully ingested ${successCount} trending repositories.`);
  return { success: true, count: successCount };
}

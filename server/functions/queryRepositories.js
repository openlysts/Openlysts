import { githubFetch, ingestRepoItem } from './runIngestion.js';
import { serverCache } from '../services/cache.js';
import { queryRepositoriesCatalog, syncDeltasFromDB } from '../services/catalogEngine.js';

const PER_PAGE = 24;


export default async function queryRepositories(req, res) {
  try {
    const body = req.body || {};

    const {
      q = '',
      categories = [],
      languages = [],
      licenses = [],
      minStars = 0,
      sort = 'trending',
      page = 1,
    } = body;

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    // Background: trigger GitHub live search for new queries on page 1 (fire-and-forget)
    if (page === 1 && q && q.trim() && GITHUB_TOKEN) {
      const queryStr = q.trim();
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(queryStr)}&sort=stars&order=desc&per_page=30`;
      
      githubFetch(url, GITHUB_TOKEN, 1).then(async (data) => {
        if (data && data.items) {
          for (const item of data.items) {
            await ingestRepoItem(item);
          }
        }
      }).catch(err => {
        console.error('GitHub fallback search failed in background:', err.message);
      });
    }

    // Ensure Neon DB deltas are fused into memory before answering, with a strict 2.5 second timeout for Vercel
    try {
      await Promise.race([
        syncDeltasFromDB(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Sync timeout')), 2500))
      ]);
    } catch (err) {
      console.warn('[queryRepositories] DB sync skipped/timeout:', err.message);
    }

    // Primary: In-memory catalog engine (sub-millisecond, zero DB cost)
    const catalogData = queryRepositoriesCatalog({
      search: q || '',
      categories: Array.isArray(categories) ? categories : (categories ? [categories] : []),
      languages: Array.isArray(languages) ? languages : (languages ? [languages] : []),
      licenses: Array.isArray(licenses) ? licenses : (licenses ? [licenses] : []),
      sort: sort || 'trending',
      page: page || 1,
      perPage: PER_PAGE,
      minStars: minStars || 0
    });

    return res.json(catalogData);
  } catch (error) {
    console.error('[queryRepositories] Unexpected error:', error.message);
    return res.status(500).json({ error: true, message: error.message });
  }
}

export function invalidateRepositoriesCache() {
  serverCache.invalidate('category_counts');
  serverCache.invalidate('global_platform_stats');
}

export async function prewarmRepositoriesCache() {
  try {
    // Compute category counts from in-memory catalog (zero DB cost)
    const catalogData = queryRepositoriesCatalog({ search: '', page: 1, perPage: 1 });
    if (catalogData.categoryCounts && Object.keys(catalogData.categoryCounts).length > 0) {
      serverCache.set('category_counts', catalogData.categoryCounts, 60 * 60 * 1000);
    }
  } catch (e) {
    console.warn('[CACHE] Prewarm repository cache error:', e.message);
  }
}

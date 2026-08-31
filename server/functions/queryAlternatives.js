import { db } from '../db/index.js';
import { serverCache } from '../services/cache.js';
import { queryAlternativesCatalog, syncDeltasFromDB } from '../services/catalogEngine.js';

const PER_PAGE = 24;

export default async function queryAlternatives(req, res) {
  try {
    const body = req.body || {};
    const {
      q = '',
      search = '',
      categories = [],
      category = '',
      sort = 'score',
      page = 1,
    } = body;

    const searchTerm = (q || search || '').trim().toLowerCase();
    let catList = Array.isArray(categories) ? [...categories] : (categories ? [categories] : []);
    if (category && category !== 'All' && !catList.includes(category)) {
      catList.push(category);
    }

    // Ensure DB deltas are synced (timeout 2.5s for Vercel limits)
    try {
      await Promise.race([
        syncDeltasFromDB(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Sync timeout')), 2500))
      ]);
    } catch (err) {
      console.warn('[queryAlternatives] DB sync skipped/timeout:', err.message);
    }

    // Primary: In-memory catalog engine (sub-millisecond, full dataset)
    const catalogData = queryAlternativesCatalog({
      category: category || (catList.length > 0 ? catList[0] : 'All'),
      search: searchTerm,
      sort: sort || 'score',
      page: page || 1,
      perPage: PER_PAGE
    });

    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      return res.json(catalogData);
    }
    return catalogData;
  } catch (error) {
    console.error('[queryAlternatives] Unexpected error:', error.message);
    if (res) {
      return res.status(500).json({ error: true, message: error.message });
    }
    throw error;
  }
}

export function invalidateAlternativesCache() {
  serverCache.invalidate('alts_');
  serverCache.invalidate('global_platform_stats');
}

export async function prewarmAlternativesCache() {
  // Prewarm logic using catalog engine
  try {
    queryAlternativesCatalog({ search: '', page: 1, perPage: 1 });
  } catch (e) {
    console.warn('[CACHE] Prewarm alternatives cache error:', e.message);
  }
}

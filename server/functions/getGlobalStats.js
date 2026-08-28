import { serverCache } from '../services/cache.js';
import { getCatalogGlobalStats, syncDeltasFromDB } from '../services/catalogEngine.js';

export default async function getGlobalStats(req, res) {
  try {
    let cachedStats = serverCache.get('global_platform_stats');
    if (cachedStats) {
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      return res.json(cachedStats);
    }

    // Hybrid Delta Engine: Ensure memory state incorporates Neon DB deltas
    await syncDeltasFromDB();

    // The catalog engine now contains the JSON base + any Neon DB deltas
    const stats = getCatalogGlobalStats();
    
    serverCache.set('global_platform_stats', stats, 15 * 60 * 1000);
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.json(stats);
  } catch (error) {
    console.error('[STATS] getGlobalStats failed:', error.message);
    const fallback = getCatalogGlobalStats(); // Fallback to current memory state without forcing sync
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return res.json(fallback);
  }
}

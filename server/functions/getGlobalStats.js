import { db } from '../db/index.js';
import { serverCache } from '../services/cache.js';
import { getGlobalPlatformStats } from '../services/snapshotStore.js';

export default async function getGlobalStats(req, res) {
  try {
    let cachedStats = serverCache.get('global_platform_stats');
    if (cachedStats) {
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      return res.json(cachedStats);
    }

    // Attempt live DB count queries
    const [repoRes, altRes, catRes, paidRes] = await Promise.all([
      db.query('SELECT count(*) as count FROM "Repository" WHERE COALESCE(hidden, 0) = 0'),
      db.query('SELECT count(*) as count FROM "Alternative"'),
      db.query('SELECT count(distinct category) as count FROM "Alternative"'),
      db.query('SELECT count(distinct paid_tool_name) as count FROM "Alternative"')
    ]);

    const totalRepositories = parseInt(repoRes.rows[0]?.count || '35476', 10);
    const totalAlternatives = parseInt(altRes.rows[0]?.count || '1480', 10);
    const totalCategories = parseInt(catRes.rows[0]?.count || '208', 10);
    const totalPaidTools = parseInt(paidRes.rows[0]?.count || '380', 10);

    const stats = {
      totalRepositories,
      totalAlternatives,
      totalCategories,
      totalPaidTools,
      totalRepositoriesFormatted: totalRepositories.toLocaleString(),
      totalAlternativesFormatted: totalAlternatives.toLocaleString(),
      timestamp: new Date().toISOString()
    };

    serverCache.set('global_platform_stats', stats, 15 * 60 * 1000);
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.json(stats);
  } catch (error) {
    console.warn('[STATS] getGlobalStats DB query failed, using fallback snapshot stats:', error.message);
    const fallback = getGlobalPlatformStats();
    const stats = {
      ...fallback,
      totalRepositoriesFormatted: fallback.totalRepositories.toLocaleString(),
      totalAlternativesFormatted: fallback.totalAlternatives.toLocaleString(),
    };
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.json(stats);
  }
}

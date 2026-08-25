import { db } from '../db/index.js';
import { serverCache } from '../services/cache.js';
import { getCatalogGlobalStats } from '../services/catalogEngine.js';

let permanentDbCountCache = null;

export default async function getGlobalStats(req, res) {
  try {
    let cachedStats = serverCache.get('global_platform_stats');
    if (cachedStats) {
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      return res.json(cachedStats);
    }

    const fallback = getCatalogGlobalStats();

    // Attempt live DB count queries
    const [repoRes, altRes, catRes, paidRes] = await Promise.all([
      db.query('SELECT count(*) as count FROM "Repository" WHERE COALESCE(hidden, 0) = 0'),
      db.query('SELECT count(*) as count FROM "Alternative"'),
      db.query('SELECT count(distinct category) as count FROM "Alternative"'),
      db.query('SELECT count(distinct paid_tool_name) as count FROM "Alternative"')
    ]);

    const totalRepositories = parseInt(repoRes.rows[0]?.count, 10) || permanentDbCountCache || 0;
    const totalAlternatives = parseInt(altRes.rows[0]?.count, 10) || 0;

    // Detect if Neon is severely underpopulated (e.g., due to data transfer quota failures)
    // If it has less than 50% of the JSON catalog's repositories, flag it as incomplete.
    if (totalRepositories > 0 && totalRepositories < fallback.totalRepositories * 0.5) {
      serverCache.set('neon_incomplete', true, 15 * 60 * 1000);
      throw new Error(`Neon DB is incomplete (${totalRepositories} repos vs ${fallback.totalRepositories} in catalog). Forcing JSON fallback.`);
    } else {
      serverCache.set('neon_incomplete', false, 15 * 60 * 1000);
    }

    if (totalRepositories > (permanentDbCountCache || fallback.totalRepositories * 0.9)) {
      permanentDbCountCache = totalRepositories;
    }

    const totalCategories = parseInt(catRes.rows[0]?.count, 10) || fallback.totalCategories;
    const totalPaidTools = parseInt(paidRes.rows[0]?.count, 10) || fallback.totalPaidTools;

    const stats = {
      ...fallback,
      totalRepositories: totalRepositories || fallback.totalRepositories,
      totalAlternatives: totalAlternatives || fallback.totalAlternatives,
      totalCategories,
      totalPaidTools,
      totalRepositoriesFormatted: totalRepositories.toLocaleString(),
      totalAlternativesFormatted: `${totalAlternatives.toLocaleString()}+`,
      timestamp: new Date().toISOString()
    };

    serverCache.set('global_platform_stats', stats, 15 * 60 * 1000);
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.json(stats);
  } catch (error) {
    console.warn('[STATS] getGlobalStats DB query failed, using catalogEngine stats:', error.message);
    const fallback = getCatalogGlobalStats();
    const stats = {
      ...fallback,
      totalRepositories: permanentDbCountCache || fallback.totalRepositories,
      totalRepositoriesFormatted: (permanentDbCountCache || fallback.totalRepositories).toLocaleString(),
      totalAlternativesFormatted: fallback.totalAlternativesFormatted,
      timestamp: new Date().toISOString()
    };
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.json(stats);
  }
}

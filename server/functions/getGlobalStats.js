import { serverCache } from '../services/cache.js';
import { getCatalogGlobalStats, getCatalogRepositories } from '../services/catalogEngine.js';
import { getArchiveCount, getArchiveDistinctCount, resetArchiveCache } from '../services/longTailArchive.js';
import { db } from '../db/index.js';

// Count of long-tail repos NOT already represented in the enriched tier.
// Cached 15 min: the number only changes when the daily window-cron demotes
// rows, and every cold read wakes Neon's serverless endpoint (~2–4.5s TLS
// wake). 60s was forcing a wake per stats window under traffic; 15 min keeps
// the counter honest while making the stats path effectively Neon-free.
// Prewarmed at boot (prewarmStatsCounters) so even the first hit is instant.
let longTailCount = { n: 0, at: 0 };
const LONG_TAIL_COUNT_TTL = 15 * 60 * 1000;
// Single-flight: when the cache is cold, concurrent stats calls (e.g. a
// traffic spike) share ONE Neon query instead of each firing the same
// NOT EXISTS count and thrashing the pool.
let longTailInFlight = null;
async function readLongTailCount() {
  if (Date.now() - longTailCount.at < LONG_TAIL_COUNT_TTL) return longTailCount.n;
  if (longTailInFlight) return longTailInFlight;
  longTailInFlight = (async () => {
    try {
      const { rows } = await db.query(
        `SELECT count(*)::bigint AS n FROM "LongTailRepo" lt
          WHERE NOT EXISTS (SELECT 1 FROM "Repository" r WHERE r.full_name = lt.full_name)`
      );
      longTailCount = { n: Number(rows[0].n) || 0, at: Date.now() };
    } catch (e) {
      // Table absent or Neon down → report 0; the count is additive and honest.
    }
    return longTailCount.n;
  })();
  try {
    return await longTailInFlight;
  } finally {
    longTailInFlight = null;
  }
}

/** Boot hook: warm the Neon-backed counters so the first stats request
 *  never pays the ~2–4.5s serverless wake (see index.js prewarm). */
export async function prewarmStatsCounters() {
  try {
    const [longTail] = await Promise.all([readLongTailCount(), readArchiveCount()]);
    return longTail;
  } catch {
    return null;
  }
}

/**
 * Cold-tier (git archive) repos NOT already counted by the enriched tier.
 * Demotion guarantees hot/SQL and archive sets are disjoint, so the exact
 * total is base + hotDistinct + archiveDistinct. The archive cache is reset
 * alongside the long-tail cache so a fresh demotion shows up within 60 s.
 */
async function readArchiveCount() {
  try {
    const ramKnown = new Set((getCatalogRepositories() || [])
      .map(r => (r.full_name || '').toLowerCase()).filter(Boolean));
    const distinct = getArchiveDistinctCount(ramKnown);
    if (distinct !== null) return distinct;
    resetArchiveCache();
    return await getArchiveCount(); // cold tier is disjoint by construction
  } catch {
    return 0; // archive absent/unreadable → additive and honest 0
  }
}

export default async function getGlobalStats(req, res) {
  try {
    let cachedStats = serverCache.get('global_platform_stats');
    if (cachedStats) {
      // No-store: the catalog count must move visibly on every reload — a long
      // browser/CDN cache here is why the number looked frozen for hours.
      // Short CDN TTL: counters stay fresh enough on reload while Vercel's
      // free edge absorbs repeated traffic without function invocations.
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      return res.json(cachedStats);
    }

    // Freshness: boot fusion + the 5-min reconcile loop keep the RAM catalog
    // current; the long-tail count is prewarmed at boot and cached 15 min —
    // the stats path answers from RAM with zero Neon wake under traffic.
    const stats = getCatalogGlobalStats();
    const [longTail, archive] = await Promise.all([readLongTailCount(), readArchiveCount()]);
    const total = stats.totalRepositories + longTail + archive;
    stats.totalRepositories = total;
    stats.catalogRepositories = stats.catalogRepositories || total;
    stats.enrichedRepositories = total - longTail - archive;
    stats.longTailRepositories = longTail;
    stats.archivedRepositories = archive;
    stats.indexedRepositories = total;
    
    // Short TTL only: stats reflect live ingestion (payload is ~300 bytes)
    serverCache.set('global_platform_stats', stats, 60 * 1000);
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.json(stats);
  } catch (error) {
    console.error('[STATS] getGlobalStats failed:', error.message);
    const fallback = getCatalogGlobalStats(); // Fallback to current memory state without forcing sync
    res.setHeader('Cache-Control', 'no-store');
    return res.json(fallback);
  }
}

/**
 * Post-ingestion hook (called by edgeCachePurger after every ingestion
 * cycle): clears the module-level counter TTLs so the very next stats request
 * recomputes the long-tail/archive totals against freshly ingested rows
 * instead of serving a count cached up to 60 s before the new rows landed.
 */
export function resetStatsCounters() {
  longTailCount = { n: 0, at: 0 };
  resetArchiveCache();
}

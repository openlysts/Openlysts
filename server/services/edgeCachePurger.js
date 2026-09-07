/**
 * edgeCachePurger.js — refresh the public stats/query caches after ingestion.
 *
 * Ingestion cycles already invalidate the in-process response caches
 * (queryRepositories/queryAlternatives/global_platform_stats). This module
 * goes one step further:
 *   1. Resets the module-level long-tail/archive counter TTLs inside
 *      getGlobalStats so the very next stats request recomputes the counter
 *      against the freshly ingested rows (previously up to a 60 s stale read).
 *   2. Best-effort purges the edge/CDN copy of the public stats/query URLs
 *      when purge credentials are configured (e.g. Cloudflare). Without
 *      credentials the short `s-maxage=60` TTL on getGlobalStats keeps the
 *      counter accurate on the next reload — the purge only accelerates it.
 *
 * Never throws: cache refresh must never fail an ingestion cycle.
 */

import { serverCache } from './cache.js';

/** Public URLs whose edge-cached copies can go stale after ingestion. */
export const PUBLIC_STATS_URLS = [
  '/api/functions/getGlobalStats',
  '/api/functions/queryRepositories',
  '/api/functions/queryAlternatives',
];

export async function purgeStatsEdgeCache() {
  // 1) In-process invalidation (instant, always runs).
  serverCache.invalidate('global_platform_stats');

  // 2) Force the module-level long-tail/archive counters to recompute now.
  try {
    const { resetStatsCounters } = await import('../functions/getGlobalStats.js');
    if (typeof resetStatsCounters === 'function') resetStatsCounters();
  } catch {
    // getGlobalStats falls back to its own 60 s TTL — fine.
  }

  const base = process.env.APP_URL || 'https://openlysts.vercel.app';
  const urls = PUBLIC_STATS_URLS.map((u) => `${base.replace(/\/$/, '')}${u}`);

  // 3) Optional edge purge — Cloudflare zone credentials.
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (zoneId && apiToken) {
    try {
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: urls }),
        }
      );
      if (res.ok) {
        console.log('[EDGE-CACHE] purged stats/query URLs on edge cache');
        return { purged: true, urls };
      }
      console.warn('[EDGE-CACHE] purge responded', res.status);
      return { purged: false, status: res.status };
    } catch (e) {
      console.warn('[EDGE-CACHE] purge failed (non-fatal):', e.message);
      return { purged: false, error: e.message };
    }
  }

  // 4) Optional generic purge endpoint hook.
  const purgeUrl = process.env.EDGE_CACHE_PURGE_URL;
  const purgeToken = process.env.EDGE_CACHE_PURGE_TOKEN;
  if (purgeUrl && purgeToken) {
    try {
      const res = await fetch(purgeUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${purgeToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });
      if (res.ok) console.log('[EDGE-CACHE] generic purge complete');
      return { purged: res.ok, status: res.status };
    } catch (e) {
      console.warn('[EDGE-CACHE] generic purge failed (non-fatal):', e.message);
      return { purged: false, error: e.message };
    }
  }

  // No purge credentials in this environment — the 60 s edge TTL bounds
  // staleness, and in-process counters are already reset above.
  return { purged: false, reason: 'no-purge-credentials' };
}

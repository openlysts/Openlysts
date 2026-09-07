import { githubFetch, ingestRepoItem } from './runIngestion.js';
import { serverCache } from '../services/cache.js';
import { queryRepositoriesCatalog } from '../services/catalogEngine.js';
import { db } from '../db/index.js';
import { searchLongTail } from '../services/longTailRepo.js';
import { searchArchive } from '../services/longTailArchive.js';
import { ensureAltGraphTables, captureDemand } from '../services/altGraph.js';
import { isTransferCritical } from '../services/transferGuard.js';

let altGraphReady = false;
async function ensureGraphTables() {
  if (altGraphReady) return true;
  try {
    await ensureAltGraphTables(db);
    altGraphReady = true;
    return true;
  } catch (e) {
    return false;
  }
}

const PER_PAGE = 24;


export default async function queryRepositories(req, res) {
  try {
    const body = req.body || {};
    // Coerce malformed params (e.g. JSON objects via ?q={...}) to a safe string
    // instead of 500-ing deep inside the search — invalid input is a 400.
    if (body.q !== undefined && typeof body.q !== 'string') {
      return res.status(400).json({ error: true, message: 'Invalid q: expected a string.' });
    }

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

    // Long-tail fallback: when the RAM catalog misses completely, surface the
    // compact Neon tier (SQL, paginated) plus the cold git-archive tier so
    // repos stay findable at ANY catalog size — no catalog rebuild required.
    if (catalogData.total === 0 && q && String(q).trim().length >= 2 && !isTransferCritical()) {
      try {
        const pageNum = page || 1;
        const longTailData = await searchLongTail(db, {
          search: q, page: pageNum, perPage: PER_PAGE, minStars: minStars || 0,
        });
        let results = longTailData.results;
        let total = longTailData.total;
        try {
          // Fill the page with cold-tier hits (hot rows come first); the
          // tiers are disjoint so no dedupe is needed.
          if (results.length < PER_PAGE) {
            const archived = await searchArchive(q, {
              minStars: minStars || 0,
              limit: PER_PAGE - results.length,
              offset: Math.max(0, (pageNum - 1) * PER_PAGE - longTailData.total),
            });
            results = results.concat(archived.results);
            total += archived.total;
          }
        } catch (e) { /* archive is additive — hot answer already computed */ }
        if (total > 0) {
          return res.json({
            ...catalogData,
            results,
            total,
            totalPages: Math.ceil(total / PER_PAGE),
            longTail: true,
          });
        }
      } catch (e) {
        // tolerate Neon hiccups — RAM answer already computed
      }
    }

    // Zero-hit searches also feed the subject auto-queue (demand discovery).
    if (catalogData.total === 0 && q && String(q).trim().length >= 3) {
      if (await ensureGraphTables()) {
        captureDemand(db, String(q).trim()).catch(() => {});
      }
    }

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
    // Representative token searches: JIT-compile the scoring/sort hot paths
    // and prime per-query caches so the FIRST real user request after boot
    // doesn't pay the ~4s V8 warm-up (measured under the load smoke).
    for (const q of ['ai', 'web', 'database', 'video']) {
      queryRepositoriesCatalog({ search: q, page: 1, perPage: 24, sort: 'trending' });
    }
    queryRepositoriesCatalog({ search: '', page: 1, perPage: 24, sort: 'trending' });
  } catch (e) {
    console.warn('[CACHE] Prewarm repository cache error:', e.message);
  }
}

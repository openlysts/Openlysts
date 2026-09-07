/**
 * windowDiscovery.js
 * Star-window enumeration — the growth engine that adds genuinely NEW repos
 * every cycle instead of re-fetching the same popular ones.
 *
 * GitHub Search returns at most 1,000 results per query ranked by relevance,
 * so broad keyword queries saturate at the same ~50 K popular repos. Narrowing
 * by star ranges (stars:501..1000) makes each query additive and window
 * ranges with >1,000 matches are split in half recursively until every query
 * returns a complete enumerable set. Each leaf costs ONE search request and
 * yields up to 1,000 never-before-seen repos — ~1 request per 1,000 repos.
 *
 * Free-tier discipline (see quotaGuard.js): per-cycle query budgets, the
 * GitHub search safety floor, and Neon storage caps gate every write.
 */

import { quotaGuard, BudgetExhaustedError } from './quotaGuard.js';
import { compactRepoRow, upsertLongTailBatch, ensureLongTailTables } from './longTailRepo.js';
import { tokenRotation } from './tokenRotation.js';

const GITHUB_API = 'https://api.github.com';
const SEARCH_URL = `${GITHUB_API}/search/repositories`;

// Geometric star windows — pending work is processed over many bounded cycles.
export const WINDOW_RANGES = [
  [50, 100], [101, 200], [201, 400], [401, 800], [801, 1600],
  [1601, 3200], [3201, 6400], [6401, 12800], [12801, 25600],
  [25601, 51200], [51201, 102400], [102401, 204800], [204801, 409600],
  [409601, 819200], [819201, 1600000], [1600001, 3200000],
  [3200001, 6400000], [6400001, 12000000], [12000001, 30000000],
];

export async function ensureWindowTables(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS "DiscoveryWindow" (
      id TEXT PRIMARY KEY,
      lo INTEGER NOT NULL,
      hi INTEGER NOT NULL,
      state TEXT NOT NULL DEFAULT 'pending',
      parent_id TEXT,
      runs INTEGER NOT NULL DEFAULT 0,
      repos_seen INTEGER NOT NULL DEFAULT 0,
      repos_added INTEGER NOT NULL DEFAULT 0,
      last_run_at TEXT,
      created_at TEXT NOT NULL,
      note TEXT
    );
  `);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_window_state ON "DiscoveryWindow"(state, lo);`);
}

/** Idempotent seeding of the base geometric windows. */
export async function seedWindows(db) {
  await ensureWindowTables(db);
  const { rows } = await db.query('SELECT count(*)::bigint AS n FROM "DiscoveryWindow"');
  if (Number(rows[0].n) > 0) return { seeded: 0 };
  const now = new Date().toISOString();
  let seeded = 0;
  for (const [lo, hi] of WINDOW_RANGES) {
    const id = `w-${lo}-${hi}`;
    await db.query(
      `INSERT INTO "DiscoveryWindow" (id, lo, hi, state, created_at) VALUES ($1,$2,$3,'pending',$4)
       ON CONFLICT (id) DO NOTHING`,
      [id, lo, hi, now]
    );
    seeded++;
  }
  return { seeded };
}

/**
 * Single bounded GitHub search request with budget tracking.
 * Injected `fetcher` keeps this unit-testable offline (default: real fetch).
 */
export async function searchWindow({ lo, hi, page = 1, perPage = 100, fetcher }) {
  const q = `stars:${lo}..${hi} archived:false`;
  const url = `${SEARCH_URL}?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${perPage}&page=${page}`;
  const doFetch = fetcher || (async (u) => {
    const tokenSrc = tokenRotation.initialized ? tokenRotation.getToken() : null;
    const token = tokenSrc?.token || process.env.GITHUB_TOKEN || '';
    const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'Openlysts-Discovery-Engine' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(u, { headers, signal: AbortSignal.timeout(15000) });
    if (res.status === 403 || res.status === 429) {
      const reset = res.headers.get('x-ratelimit-reset');
      if (tokenSrc && tokenRotation.initialized) {
        tokenRotation.reportRateLimit(tokenSrc.index, reset ? parseInt(reset, 10) : undefined);
      }
      const err = new Error(`GitHub search rate limited (${res.status})`);
      err.code = 'RATE_LIMITED';
      throw err;
    }
    if (res.status === 401) {
      if (tokenSrc && tokenRotation.initialized) tokenRotation.reportAuthError(tokenSrc.index);
      throw new Error('GitHub search 401 — token disabled');
    }
    if (!res.ok) throw new Error(`GitHub search HTTP ${res.status}`);
    quotaGuard.noteSearchHeaders(
      res.headers.get('x-ratelimit-remaining'),
      res.headers.get('x-ratelimit-reset')
    );
    return res.json();
  });
  return doFetch(url);
}

/** Pure: does this window need splitting? (1000-item GitHub cap) */
export function shouldSplit(data, perPage = 100) {
  if (!data) return false;
  const total = Number(data.total_count);
  const got = (data.items || []).length;
  // total_count is capped at 1000 by GitHub: exactly 1000 means "≥1000".
  return total >= 1000 && got === perPage;
}

/**
 * Run one bounded enumeration cycle.
 * @param {object} opts
 * @param {number} opts.maxQueries max GitHub search requests this cycle
 * @param {boolean} opts.preferPending only enumerate never-run windows
 * @param {Set|null} opts.ramKnown enriched full_names to skip (lowercased)
 * @param {Function} opts.fetcher injectable for tests
 * @returns stats object
 */
export async function runWindowCycle({ db, maxQueries = 6, preferPending = false, ramKnown = null, fetcher } = {}) {
  await seedWindows(db);
  await ensureLongTailTables(db);
  await quotaGuard.refreshStorageSizes(db, false);
  const nowIso = new Date().toISOString();
  const stats = { queries: 0, windowsProcessed: 0, split: 0, reposSeen: 0, inserted: 0, updated: 0, skippedKnown: 0, exhausted: false };

  for (let qi = 0; qi < maxQueries; qi++) {
    try {
      quotaGuard.assertSearchBudget(1);
    } catch (e) {
      if (e instanceof BudgetExhaustedError) {
        stats.exhausted = true;
        console.warn(`[WINDOWS] ${e.message} — cycle ending early after ${stats.queries} queries`);
        break;
      }
      throw e;
    }

    // Pick the next window (pending first, then stale done windows).
    let pick;
    try {
      const { rows } = await db.query(
        preferPending
          ? `SELECT id, lo, hi, state, last_run_at FROM "DiscoveryWindow" WHERE state = 'pending' ORDER BY lo ASC LIMIT 1`
          : `SELECT id, lo, hi, state, last_run_at FROM "DiscoveryWindow"
             WHERE state <> 'active'
             ORDER BY (CASE WHEN state = 'pending' THEN 0 ELSE 1 END), lo ASC LIMIT 1`
      );
      if (rows.length === 0) {
        stats.exhausted = true; // all windows fresh
        break;
      }
      pick = rows[0];
      if (pick.state !== 'pending') {
        const staleMs = Date.now() - new Date(pick.last_run_at || 0).getTime();
        if (staleMs < 7 * 24 * 3600 * 1000) {
          stats.exhausted = true; // nothing stale yet
          break;
        }
      }
    } catch (e) {
      console.error('[WINDOWS] pick error:', e.message);
      break;
    }

    // Claim it (soft lock via active state).
    await db.query(
      `UPDATE "DiscoveryWindow" SET state = 'active', note = $2 WHERE id = $1`,
      [pick.id, `claimed ${nowIso}`]
    );

    try {
      // Page 1 tells us size; enumerate up to the 1000-item cap.
      const data = await searchWindow({ lo: pick.lo, hi: pick.hi, page: 1, fetcher });
      stats.queries++;
      const items = (data && data.items) || [];

      if (shouldSplit(data) && pick.hi - pick.lo > 1) {
        // Window holds >1,000 repos — split in half for complete enumeration.
        const mid = Math.floor((pick.lo + pick.hi) / 2);
        const now2 = new Date().toISOString();
        await db.query(
          `INSERT INTO "DiscoveryWindow" (id, lo, hi, state, parent_id, created_at)
           VALUES ($1,$2,$3,'pending',$4,$5) ON CONFLICT (id) DO NOTHING`,
          [`${pick.id}-a`, pick.lo, mid, pick.id, now2]
        );
        await db.query(
          `INSERT INTO "DiscoveryWindow" (id, lo, hi, state, parent_id, created_at)
           VALUES ($1,$2,$3,'pending',$4,$5) ON CONFLICT (id) DO NOTHING`,
          [`${pick.id}-b`, mid + 1, pick.hi, pick.id, now2]
        );
        await db.query(
          `UPDATE "DiscoveryWindow" SET state = 'split', note = $2, last_run_at = $3, repos_seen = repos_seen + $4 WHERE id = $1`,
          [pick.id, `split at ${nowIso}`, nowIso, items.length]
        );
        stats.split++;
        stats.reposSeen += items.length;
        continue;
      }

      // Enumerate remaining pages only when page 1 filled the per_page cap —
      // bounded by the remaining query budget for this cycle.
      let all = items;
      let page = 1;
      while (all.length >= 100 && page < 10 && stats.queries < maxQueries) {
        try { quotaGuard.assertSearchBudget(1); } catch (e) {
          if (e instanceof BudgetExhaustedError) { stats.exhausted = true; break; }
          throw e;
        }
        page++;
        const next = await searchWindow({ lo: pick.lo, hi: pick.hi, page, fetcher });
        stats.queries++;
        const nextItems = (next && next.items) || [];
        all = all.concat(nextItems);
        if (nextItems.length < 100) break;
      }

      const rows = all.map(compactRepoRow).filter(Boolean);
      stats.reposSeen += rows.length;
      let leafInserted = 0;
      if (rows.length > 0) {
        try {
          quotaGuard.assertStorageBudget(rows.length, db);
          const res = await upsertLongTailBatch(db, rows, { ramKnown });
          stats.inserted += res.inserted;
          stats.updated += res.updated;
          stats.skippedKnown += res.skippedKnown;
          leafInserted = res.inserted;
        } catch (e) {
          if (e instanceof BudgetExhaustedError) {
            stats.exhausted = true;
            console.warn(`[WINDOWS] ${e.message}`);
            break;
          }
          throw e;
        }
      }

      await db.query(
        `UPDATE "DiscoveryWindow"
           SET state = 'done', last_run_at = $2, runs = runs + 1,
               repos_seen = repos_seen + $3, repos_added = repos_added + $4, note = $5
         WHERE id = $1`,
        [pick.id, nowIso, rows.length, leafInserted, `leaf ${nowIso}`]
      );
      stats.windowsProcessed++;
    } catch (e) {
      if (e.code === 'RATE_LIMITED') {
        stats.exhausted = true;
        console.warn('[WINDOWS] rate limited — cycle ending; window will retry next cycle');
        await db.query(`UPDATE "DiscoveryWindow" SET state = 'pending', note = $2 WHERE id = $1`, [pick.id, 'rate-limited, retry']);
        break;
      }
      console.error(`[WINDOWS] window ${pick.id} (${pick.lo}..${pick.hi}) failed:`, e.message);
      await db.query(`UPDATE "DiscoveryWindow" SET state = 'pending', note = $2 WHERE id = $1`, [pick.id, `error: ${e.message.slice(0, 120)}`]);
      // Not a quota failure — allow other windows to try.
    }
  }

  quotaGuard.refreshStorageSizes(db, false).catch(() => {});
  return stats;
}

export async function windowStatus(db) {
  const { rows } = await db.query(
    `SELECT state, count(*)::bigint AS n, COALESCE(sum(repos_seen), 0)::bigint AS seen
       FROM "DiscoveryWindow" GROUP BY state ORDER BY state`
  );
  return { windows: rows.map(r => ({ state: r.state, count: Number(r.n), reposSeen: Number(r.seen) })) };
}

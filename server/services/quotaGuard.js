/**
 * quotaGuard.js
 * Free-tier quota governor. Keeps every autonomous growth loop inside
 * GitHub / Neon / Vercel free-plan ceilings so no cycle can ever blow a cap:
 *
 *  - GitHub *search* budget  (30 req/min per authenticated token, 10/min anon)
 *  - Neon *storage* budget   (0.5 GB free plan → conservative target caps)
 *
 * Pure decision helpers are exported separately so they are unit-testable
 * offline; stateful parts read/write SystemConfig so budgets survive restarts
 * and are shared across Vercel instances.
 */

// Neon free plan = 0.5 GB. We never target the raw ceiling; defaults aim at a
// safe margin (whole DB ≤ 420 MB, long-tail table ≤ 360 MB).
export const NEON_FREE_BYTES = 0.5 * 1024 * 1024 * 1024; // 536,870,912
export const DEFAULT_DB_CAP_BYTES = 420 * 1024 * 1024;
export const DEFAULT_LONGTAIL_CAP_BYTES = 360 * 1024 * 1024;

// GitHub search resource: authenticated tokens get 30 requests/minute.
export const SEARCH_LIMIT_PER_MIN = 30;
// Stop pulling new queries when remaining drops to this floor — leaves headroom
// for interactive/user-driven searches that share the same bucket.
export const SEARCH_SAFETY_FLOOR = 6;
// Estimated average compact long-tail row (incl. heap + index overhead).
// Measured 1,063 B/row pre-compression; ~450 B is the post-compression
// planning figure (pipe-delimited topics, 160-char descriptions) with margin.
export const EST_LONGTAIL_ROW_BYTES = 450;

// Tiered-storage dials: the Neon hot table never exceeds HOT_CAP rows. When it
// crosses the DEMOTE trigger, the daily window-cron archives the coldest rows
// into compressed git shards (longTailArchive.js) before the next cycle.
export const LONGTAIL_HOT_CAP = 250_000;
export const LONGTAIL_DEMOTE_TRIGGER = 200_000; // 80% of hot cap

export class BudgetExhaustedError extends Error {
  constructor(kind, detail) {
    super(`Budget exhausted: ${kind} (${detail})`);
    this.name = 'BudgetExhaustedError';
    this.code = 'BUDGET_EXHAUSTED';
    this.kind = kind;
  }
}

/**
 * Pure: decide whether a projected long-tail table size stays under a cap.
 * @param {number} currentBytes measured pg_total_relation_size of the table
 * @param {number} projectedRows new rows this cycle
 * @param {number} capBytes
 */
export function longTailWithinBudget(currentBytes, projectedRows, capBytes = DEFAULT_LONGTAIL_CAP_BYTES) {
  const projected = currentBytes + projectedRows * EST_LONGTAIL_ROW_BYTES;
  return { ok: projected <= capBytes, projectedBytes: projected, capBytes };
}

/**
 * Pure: decide whether a search budget permits N more requests.
 */
export function searchBudgetAllows(remaining, needed = 1, floor = SEARCH_SAFETY_FLOOR) {
  return { ok: remaining >= floor + needed, remaining, needed };
}

/**
 * Pure: how many cold rows the archive tier must absorb (0 = none). Demotion
 * kicks in past the DEMOTE trigger and shrinks the hot table back to 90% of
 * the trigger — hysteresis so the cron never flip-flops at the boundary.
 */
export function longTailDemotePlan(rowCount, { hotCap = LONGTAIL_HOT_CAP, demoteTrigger = LONGTAIL_DEMOTE_TRIGGER } = {}) {
  const rows = Math.max(0, Number(rowCount) || 0);
  const toDemote = rows > demoteTrigger ? rows - Math.floor(demoteTrigger * 0.9) : 0;
  return { demote: toDemote > 0, toDemote, hotCap, demoteTrigger, overCap: rows > hotCap };
}

/**
 * Pure: which star window is best to enumerate next, given done-window dates.
 * Returns index into the sorted window list, or -1 when everything is fresh.
 * @param {Array<{lo:number,hi:number,lastRunAt:number|null,state:string}>} windows
 * @param {number} refreshMs window freshness before re-running
 */
export function pickNextWindow(windows, refreshMs = 7 * 24 * 3600 * 1000) {
  const now = Date.now();
  let best = -1;
  let bestKey = Infinity;
  windows.forEach((w, i) => {
    if (w.state === 'active') return; // another worker is on it
    if (w.state === 'done' && w.lastRunAt && now - w.lastRunAt < refreshMs) return;
    const last = w.lastRunAt ? new Date(w.lastRunAt).getTime() : 0;
    const score = w.state === 'pending' ? w.lo : w.lo + 1e9; // pending always first
    if (score < bestKey) { bestKey = score; best = i; }
    if (last === 0 && best === -1) { best = i; bestKey = w.lo; }
  });
  return best;
}

// ── Stateful budget store ──────────────────────────────────────────────
class QuotaGuard {
  constructor() {
    this.search = {
      remaining: null, // null = unknown until first response header
      resetAtMs: 0,
      lastHeaderAt: 0,
      exhaustedAt: 0,
    };
    this.storageCache = { dbBytes: null, longTailBytes: null, measuredAt: 0 };
  }

  /** Called after every GitHub search response with its resource headers. */
  noteSearchHeaders(remainingRaw, resetRaw) {
    if (remainingRaw !== undefined && remainingRaw !== null) {
      const remaining = parseInt(remainingRaw, 10);
      if (!Number.isNaN(remaining)) {
        this.search.remaining = remaining;
        this.search.lastHeaderAt = Date.now();
        if (remaining <= SEARCH_SAFETY_FLOOR) this.search.exhaustedAt = Date.now();
        else this.search.exhaustedAt = 0;
      }
    }
    if (resetRaw) {
      const reset = parseInt(resetRaw, 10);
      if (!Number.isNaN(reset)) this.search.resetAtMs = reset * 1000;
    }
  }

  /** Throws BudgetExhaustedError when the search budget cannot take `needed`. */
  assertSearchBudget(needed = 1) {
    if (this.search.exhaustedAt) {
      const wait = this.search.resetAtMs - Date.now();
      throw new BudgetExhaustedError(
        'github_search',
        `safety floor reached; resets in ${Math.max(0, Math.round(wait / 1000))}s`
      );
    }
    if (this.search.remaining !== null) {
      const check = searchBudgetAllows(this.search.remaining, needed);
      if (!check.ok) {
        throw new BudgetExhaustedError(
          'github_search',
          `${this.search.remaining} remaining, ${needed} needed (+${SEARCH_SAFETY_FLOOR} floor)`
        );
      }
    }
  }

  async refreshStorageSizes(db, force = false) {
    const now = Date.now();
    if (!force && this.storageCache.dbBytes !== null && now - this.storageCache.measuredAt < 15 * 60 * 1000) {
      return this.storageCache;
    }
    try {
      const r = await db.query(
        `SELECT COALESCE((SELECT pg_total_relation_size('"LongTailRepo"')), 0) AS longtail,
                (SELECT pg_database_size(current_database())) AS db`
      );
      this.storageCache = {
        longTailBytes: Number(r.rows[0].longtail) || 0,
        dbBytes: Number(r.rows[0].db) || 0,
        measuredAt: now,
      };
    } catch (e) {
      // Fall back to last known values (db may be unreachable momentarily)
    }
    return this.storageCache;
  }

  /**
   * Throws BudgetExhaustedError when persisting `projectedRows` long-tail rows
   * would cross the storage caps.
   */
  assertStorageBudget(projectedRows, db) {
    const s = this.storageCache;
    const lt = longTailWithinBudget(s.longTailBytes || 0, projectedRows);
    if (!lt.ok) {
      throw new BudgetExhaustedError(
        'neon_storage',
        `long-tail table would reach ${Math.round(lt.projectedBytes / 1024 / 1024)}MB of ${Math.round(lt.capBytes / 1024 / 1024)}MB cap`
      );
    }
    const dbProjected = (s.dbBytes || 0) + projectedRows * EST_LONGTAIL_ROW_BYTES;
    if (dbProjected > DEFAULT_DB_CAP_BYTES) {
      throw new BudgetExhaustedError(
        'neon_storage',
        `whole DB would reach ${Math.round(dbProjected / 1024 / 1024)}MB of ${Math.round(DEFAULT_DB_CAP_BYTES / 1024 / 1024)}MB cap`
      );
    }
    return true;
  }

  getStatus() {
    return {
      search: {
        remaining: this.search.remaining,
        floor: SEARCH_SAFETY_FLOOR,
        limitPerMin: SEARCH_LIMIT_PER_MIN,
        exhausted: !!this.search.exhaustedAt,
        resetAt: this.search.resetAtMs ? new Date(this.search.resetAtMs).toISOString() : null,
        lastHeaderAt: this.search.lastHeaderAt ? new Date(this.search.lastHeaderAt).toISOString() : null,
      },
      storage: {
        dbBytes: this.storageCache.dbBytes,
        dbCapBytes: DEFAULT_DB_CAP_BYTES,
        longTailBytes: this.storageCache.longTailBytes,
        longTailCapBytes: DEFAULT_LONGTAIL_CAP_BYTES,
        hotCapRows: LONGTAIL_HOT_CAP,
        demoteTriggerRows: LONGTAIL_DEMOTE_TRIGGER,
        measuredAt: this.storageCache.measuredAt ? new Date(this.storageCache.measuredAt).toISOString() : null,
      },
    };
  }
}

export const quotaGuard = new QuotaGuard();

/**
 * budgetSnapshot.js — Neon-persisted daily GitHub Actions budget snapshots.
 *
 * Why: the admin budget panel reads Actions usage straight from the GitHub
 * API, so a rate-limited or misconfigured token blanks the panel out. This
 * module writes one row per UTC day into Neon (from the budget endpoint AND
 * the daily window cron), so the panel can always show the last-known monthly
 * Actions-minute total even when GitHub is unreachable.
 *
 * Table (idempotent, created at runtime to match Openlysts conventions):
 *   "ActionsBudgetSnapshot" — one row per UTC snapshot_date.
 */

import { db } from '../db/index.js';

const TABLE = '"ActionsBudgetSnapshot"';

export async function ensureBudgetSnapshotTable(database = db) {
  await database.query(
    `CREATE TABLE IF NOT EXISTS ${TABLE} (
      id TEXT PRIMARY KEY,
      snapshot_date TEXT NOT NULL,
      source TEXT NOT NULL,
      billing_total_minutes REAL,
      day_minutes REAL,
      repo_public BOOLEAN,
      measured_at TEXT,
      created_at TEXT,
      updated_at TEXT
    )`
  );
  await database.query(
    `CREATE INDEX IF NOT EXISTS idx_actions_budget_snapshot_date ON ${TABLE}(snapshot_date)`
  );
}

/** UTC date string (YYYY-MM-DD) for a given Date. */
export function utcDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

/**
 * Upsert today's snapshot. Never throws — budget telemetry must not take the
 * admin panel or a cron run down.
 *
 * @param {object} opts
 * @param {string} opts.source           'billing' | 'billing-unavailable' | 'cron' | 'runs'
 * @param {number|null} [opts.billingTotalMinutes] GitHub billing total for the
 *                                       current billing cycle (when readable)
 * @param {number|null} [opts.dayMinutes] Locally-attributable minutes for the day
 * @param {boolean|null} [opts.repoPublic]
 * @param {string} [opts.date]           UTC 'YYYY-MM-DD'
 */
export async function recordBudgetSnapshot({
  source = 'billing',
  billingTotalMinutes = null,
  dayMinutes = null,
  repoPublic = null,
  date = utcDate(),
  database = db,
} = {}) {
  try {
    await ensureBudgetSnapshotTable(database);
    const now = new Date().toISOString();
    await database.query(
      `INSERT INTO ${TABLE} (id, snapshot_date, source, billing_total_minutes, day_minutes, repo_public, measured_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         source = EXCLUDED.source,
         billing_total_minutes = COALESCE(EXCLUDED.billing_total_minutes, ${TABLE}.billing_total_minutes),
         day_minutes = COALESCE(EXCLUDED.day_minutes, ${TABLE}.day_minutes),
         repo_public = COALESCE(EXCLUDED.repo_public, ${TABLE}.repo_public),
         measured_at = EXCLUDED.measured_at,
         updated_at = EXCLUDED.updated_at`,
      [date, date, source, billingTotalMinutes, dayMinutes, repoPublic ?? null, now, now, now]
    );
    return { ok: true, date };
  } catch (e) {
    console.warn('[BUDGET-SNAPSHOT] record failed:', e.message);
    return { ok: false, error: e.message };
  }
}

/** Recent snapshots ascending by date (newest last). */
export async function listBudgetSnapshots({ days = 45, database = db } = {}) {
  try {
    const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
    const { rows } = await database.query(
      `SELECT snapshot_date, source, billing_total_minutes, day_minutes, repo_public, measured_at
       FROM ${TABLE} WHERE snapshot_date >= $1 ORDER BY snapshot_date ASC`,
      [since]
    );
    return rows || [];
  } catch (e) {
    return [];
  }
}

/**
 * Best available "true monthly Actions total":
 *  1. Freshest GitHub billing total read this billing cycle (< 40 days old).
 *  2. Same total but stale (token has been rate-limited since) — still shown,
 *     tagged 'billing-stale' so operators can see the data age.
 *  3. Sum of locally-attributed day minutes across the current UTC month.
 * Returns null only when Neon has never recorded anything.
 */
export async function getMonthlyActionsMinutes({ database = db } = {}) {
  try {
    const rows = await listBudgetSnapshots({ database });
    if (!rows.length) return null;

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      .toISOString().slice(0, 10);

    const billingRows = rows.filter((r) => r.billing_total_minutes != null);
    if (billingRows.length > 0) {
      const latest = billingRows[billingRows.length - 1];
      const ageDays = latest.measured_at
        ? (Date.now() - new Date(latest.measured_at).getTime()) / 86_400_000
        : Infinity;
      return {
        totalMinutes: Math.round(Number(latest.billing_total_minutes) * 10) / 10,
        from: ageDays <= 40 ? 'billing' : 'billing-stale',
        date: latest.snapshot_date,
        source: latest.source,
      };
    }

    const monthMinutes = rows
      .filter((r) => r.snapshot_date >= monthStart)
      .reduce((sum, r) => sum + (Number(r.day_minutes) || 0), 0);
    if (monthMinutes > 0) {
      const latest = rows[rows.length - 1];
      return {
        totalMinutes: Math.round(monthMinutes * 10) / 10,
        from: 'snapshot-sum',
        date: latest.snapshot_date,
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

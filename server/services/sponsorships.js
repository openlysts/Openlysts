// ─── Monetization: Sponsored Placements + App Settings ───────────────
// Phase-1 revenue layer. Admins schedule "featured/sponsored" placements
// via the Admin GUI; the public read path is a tiny, server-cached + edge-
// cached JSON so user-facing requests never touch Neon (transfer savings).
//
// Trust rules enforced here:
//  - only `active = 1` placements inside [starts_at, ends_at] are public
//  - a placement never modifies organic ranking; it only adds a visible
//    "Sponsored" badge + optional top-of-section placement on the client
//  - badge_label is always shown verbatim next to the item (disclosure)

import { db } from '../db/index.js';
import { ensureMonetizationTables } from '../db/schema.js';

let tablesReady = false;
async function ensureTables() {
  if (tablesReady) return true;
  try {
    await ensureMonetizationTables(db);
    tablesReady = true;
    return true;
  } catch (e) {
    console.error('[SPONSOR] table ensure failed:', e.message);
    return false;
  }
}

// ── Server-side cache for the public read model ─────────────────────
// 60s TTL: any admin edit invalidates immediately, so the panel stays
// honest while public reads are cheap.
let publicCache = null;
let publicCacheAt = 0;
const PUBLIC_CACHE_MS = 60 * 1000;

export function invalidateSponsorshipsCache() {
  publicCache = null;
  publicCacheAt = 0;
}

/** Parse an ISO datetime-or-empty value into a comparable timestamp. */
function ts(value) {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : null;
}

/**
 * Canonicalize a datetime for storage: ALWAYS UTC ISO-8601 with ms + Z.
 * The public read filter compares these columns lexicographically against
 * `new Date().toISOString()`, so naive local datetimes ("2026-09-06T17:46"
 * from datetime-local inputs) silently excluded live placements — "17:46"
 * sorts AFTER "12:34Z" for the same date. Browsers send the admin's local
 * wall time; Date.parse treats a naive value as local time, so converting
 * here on the server ALSO assumes local time for naive API values (the
 * client already converts to UTC ISO, making this a defensive backstop).
 */
function normalizeDt(value) {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

/**
 * Compute the human status of a placement row.
 * 'live' | 'scheduled' | 'expired' | 'paused'
 */
export function placementStatus(row, now = Date.now()) {
  if (!row.active) return 'paused';
  const start = ts(row.starts_at);
  const end = ts(row.ends_at);
  if (start && now < start) return 'scheduled';
  if (end && now > end) return 'expired';
  return 'live';
}

// ── Admin CRUD ───────────────────────────────────────────────────────

export async function listSponsorships() {
  if (!(await ensureTables())) return [];
  const { rows } = await db.query(
    `SELECT id, placement_type, target_name, badge_label, sponsor_name, sponsor_url,
            starts_at, ends_at, active, sort_order, created_at, updated_at
     FROM "SponsoredPlacement"
     ORDER BY active DESC, sort_order DESC, id DESC`
  );
  const now = Date.now();
  return rows.map((r) => ({ ...r, status: placementStatus(r, now) }));
}

export async function createSponsorship(data) {
  if (!(await ensureTables())) throw new Error('Monetization tables unavailable');
  const {
    placement_type = 'repository',
    target_name = '',
    badge_label = 'Sponsored',
    sponsor_name = '',
    sponsor_url = '',
    starts_at = '',
    ends_at = '',
    active = 1,
    sort_order = 0,
  } = data || {};
  if (!['repository', 'alternative'].includes(placement_type)) {
    throw new Error('placement_type must be repository or alternative');
  }
  if (!target_name || !target_name.trim()) throw new Error('target_name is required');

  const now = new Date().toISOString();
  const { rows } = await db.query(
    `INSERT INTO "SponsoredPlacement"
       (placement_type, target_name, badge_label, sponsor_name, sponsor_url,
        starts_at, ends_at, active, sort_order, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
     RETURNING *`,
    [
      placement_type,
      target_name.trim(),
      badge_label.trim() || 'Sponsored',
      (sponsor_name || '').trim(),
      (sponsor_url || '').trim(),
      normalizeDt(starts_at),
      normalizeDt(ends_at),
      active ? 1 : 0,
      Number(sort_order) || 0,
      now,
    ]
  );
  invalidateSponsorshipsCache();
  return rows[0];
}

export async function updateSponsorship(id, data) {
  if (!(await ensureTables())) throw new Error('Monetization tables unavailable');
  const existing = await db.query(`SELECT id FROM "SponsoredPlacement" WHERE id = $1`, [id]);
  if (existing.rows.length === 0) return null;

  const pick = (v, fallback) => (v === undefined ? fallback : v);
  const {
    placement_type = null,
    target_name = null,
    badge_label = null,
    sponsor_name = null,
    sponsor_url = null,
    starts_at = null,
    ends_at = null,
    active = null,
    sort_order = null,
  } = data || {};

  const { rows } = await db.query(
    `UPDATE "SponsoredPlacement" SET
       placement_type = COALESCE($2, placement_type),
       target_name = COALESCE($3, target_name),
       badge_label = COALESCE($4, badge_label),
       sponsor_name = COALESCE($5, sponsor_name),
       sponsor_url = COALESCE($6, sponsor_url),
       starts_at = COALESCE($7, starts_at),
       ends_at = COALESCE($8, ends_at),
       active = COALESCE($9, active),
       sort_order = COALESCE($10, sort_order),
       updated_at = $11
     WHERE id = $1 RETURNING *`,
    [
      id,
      pick(placement_type, null),
      pick(target_name, null)?.trim() ?? null,
      pick(badge_label, null)?.trim() ?? null,
      pick(sponsor_name, null)?.trim() ?? null,
      pick(sponsor_url, null)?.trim() ?? null,
      pick(starts_at, null) === null ? null : normalizeDt(starts_at),
      pick(ends_at, null) === null ? null : normalizeDt(ends_at),
      active === null ? null : (active ? 1 : 0),
      sort_order === null ? null : Number(sort_order) || 0,
      new Date().toISOString(),
    ]
  );
  invalidateSponsorshipsCache();
  return rows[0];
}

export async function deleteSponsorship(id) {
  if (!(await ensureTables())) throw new Error('Monetization tables unavailable');
  const res = await db.query(`DELETE FROM "SponsoredPlacement" WHERE id = $1`, [id]);
  invalidateSponsorshipsCache();
  return (res.rowCount || 0) > 0;
}

// ── Public read model ────────────────────────────────────────────────

/**
 * Active placements + donation config, ready for the client.
 * Server-cached 60s; callers should also set edge Cache-Control headers.
 */
export async function getPublicSponsorships({ force = false } = {}) {
  const now = Date.now();
  if (!force && publicCache && now - publicCacheAt < PUBLIC_CACHE_MS) {
    return publicCache;
  }
  if (!(await ensureTables())) {
    return { placements: [], settings: {} };
  }

  const [placementsRes, settingsRes] = await Promise.all([
    db.query(
      `SELECT placement_type, target_name, badge_label, sponsor_name, sponsor_url, sort_order
       FROM "SponsoredPlacement"
       WHERE active = 1
         AND (starts_at IS NULL OR starts_at = '' OR starts_at <= $1)
         AND (ends_at IS NULL OR ends_at = '' OR ends_at >= $1)
       ORDER BY sort_order DESC, id ASC`,
      [new Date(now).toISOString()]
    ),
    db.query(`SELECT key, value FROM "AppSetting"`),
  ]);

  const settings = {};
  for (const row of settingsRes.rows) settings[row.key] = row.value;

  const result = {
    placements: placementsRes.rows.map((r) => ({
      placement_type: r.placement_type,
      target_name: r.target_name,
      badge_label: r.badge_label || 'Sponsored',
      sponsor_name: r.sponsor_name || '',
      sponsor_url: r.sponsor_url || '',
      sort_order: r.sort_order || 0,
    })),
    settings: {
      donation_enabled: settings.donation_enabled === '1' || settings.donation_enabled === 'true',
      donation_label: settings.donation_label || 'Support Openlysts',
      donation_url: settings.donation_url || '',
      updated_at: settings.donation_updated_at || '',
    },
  };
  publicCache = result;
  publicCacheAt = now;
  return result;
}

// ── App settings (GUI-managed, key/value) ────────────────────────────

export async function getAppSettings() {
  if (!(await ensureTables())) return {};
  const { rows } = await db.query(`SELECT key, value FROM "AppSetting"`);
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export async function setAppSetting(key, value) {
  if (!(await ensureTables())) throw new Error('Monetization tables unavailable');
  await db.query(
    `INSERT INTO "AppSetting" (key, value, updated_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
    [key, value == null ? '' : String(value), new Date().toISOString()]
  );
  invalidateSponsorshipsCache();
}
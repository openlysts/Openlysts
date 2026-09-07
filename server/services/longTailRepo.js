/**
 * longTailRepo.js
 * Compact "long-tail" repository store — the free-tier-compatible tier for the
 * star-window enumeration engine. Full-metadata/enriched repos live in the
 * existing `Repository` table (fused into the RAM catalog); everything the
 * window enumerator discovers beyond that lands here in ~450 B/row. The hot
 * table is capped (quotaGuard LONGTAIL_HOT_CAP); overflow is auto-demoted into
 * compressed git shards (longTailArchive.js) — Neon stays inside the 0.5 GB
 * free plan at any catalog size.
 *
 * Table is self-healing (created on first use, idempotent) to match the
 * collections-module precedent — the schema.js bootstrap is CLI-only here.
 */

import crypto from 'crypto';

export const LONGTAIL_TABLE = 'LongTailRepo';
const DESCRIPTION_MAX = 160; // search is prefix-style; full blurbs add bytes, not recall
const TOPICS_MAX = 10;

/** Decode compact topics storage. New rows are pipe-delimited; legacy rows
 *  are comma-joined — '|' is escaped to '/' on encode, so its presence tells
 *  the two formats apart. */
export function parseLongTailTopics(raw) {
  if (!raw) return [];
  const s = String(raw);
  return (s.includes('|') ? s.split('|') : s.split(',')).filter(Boolean);
}

/** Encode topics for storage: '|' cannot appear inside a topic. */
function encodeTopics(topics) {
  if (!Array.isArray(topics) || topics.length === 0) return null;
  const cleaned = topics.slice(0, TOPICS_MAX).map(t => String(t).replace(/\|/g, '/')).filter(Boolean);
  return cleaned.length ? cleaned.join('|') : null;
}

export async function ensureLongTailTables(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS "LongTailRepo" (
      full_name TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner TEXT NOT NULL DEFAULT '',
      github_id BIGINT,
      stars INTEGER NOT NULL DEFAULT 0,
      forks INTEGER NOT NULL DEFAULT 0,
      language TEXT,
      description TEXT,
      topics TEXT,
      license_key TEXT,
      archived INTEGER NOT NULL DEFAULT 0,
      pushed_at TEXT,
      github_updated_at TEXT,
      first_seen_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL
    );
  `);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_longtail_stars ON "LongTailRepo"(stars DESC);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_longtail_lang ON "LongTailRepo"(language) WHERE language IS NOT NULL;`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_longtail_updated ON "LongTailRepo"(github_updated_at);`);
  // full_name index: the global-stats counter probes LongTailRepo.full_name
  // against Repository.full_name (NOT EXISTS) — without it every stats call
  // seq-scans the whole long-tail table.
  await db.query(`CREATE INDEX IF NOT EXISTS idx_longtail_full_name ON "LongTailRepo"(full_name);`);
  // Trigram GIN indexes were removed on purpose: the hot table is capped at
  // ~250k rows (LONGTAIL_HOT_CAP) where seq-scan LIKE search is 5–20 ms, and
  // each GIN index cost ~150–300 B/row of the free 0.5 GB. Drop legacy ones
  // idempotently so pre-existing databases shrink too.
  try {
    await db.query(`DROP INDEX IF EXISTS idx_longtail_trgm_full;`);
    await db.query(`DROP INDEX IF EXISTS idx_longtail_trgm_name;`);
  } catch (e) { /* older table shapes — nothing to drop */ }
}

/** Pure: shape a GitHub search API item into a compact long-tail row. */
export function compactRepoRow(item) {
  const fullName = item.full_name || '';
  const slash = fullName.indexOf('/');
  return {
    full_name: fullName,
    name: item.name || fullName.slice(slash + 1) || fullName,
    owner: (item.owner?.login) || fullName.slice(0, slash) || '',
    github_id: item.id ? Number(item.id) : null,
    stars: Number(item.stargazers_count) || Number(item.stars) || 0,
    forks: Number(item.forks_count) || Number(item.forks) || 0,
    language: item.language || null,
    description: item.description ? item.description.slice(0, DESCRIPTION_MAX) : null,
    topics: encodeTopics(item.topics),
    license_key: item.license?.spdx_id || item.license_key || null,
    archived: item.archived ? 1 : 0,
    pushed_at: item.pushed_at || null,
    github_updated_at: item.updated_at || null,
  };
}

/**
 * Upsert a batch of compact rows. `ramKnown` is an optional Set of
 * full_names already served from RAM (enriched tier) — those rows are skipped
 * here because they already count toward the visible catalog.
 * Returns { inserted, updated, skippedKnown, skippedJunk }.
 */
export async function upsertLongTailBatch(db, rows, { ramKnown = null } = {}) {
  if (!rows || rows.length === 0) return { inserted: 0, updated: 0, skippedKnown: 0, skippedJunk: 0 };

  const cleaned = rows.filter(r => r && r.full_name && typeof r.full_name === 'string' && r.full_name.includes('/'));
  let skippedKnown = 0;
  if (ramKnown && ramKnown.size > 0) {
    const kept = [];
    for (const r of cleaned) {
      if (ramKnown.has(r.full_name.toLowerCase())) skippedKnown++;
      else kept.push(r);
    }
    cleaned.length = 0;
    cleaned.push(...kept);
    if (cleaned.length === 0) {
      return { inserted: 0, updated: 0, skippedKnown, skippedJunk: 0 };
    }
  }

  const now = new Date().toISOString();
  let inserted = 0;
  let updated = 0;
  const CHUNK = 150;
  for (let i = 0; i < cleaned.length; i += CHUNK) {
    const chunk = cleaned.slice(i, i + CHUNK);
    const values = [];
    const params = [];
    chunk.forEach((r, idx) => {
      const base = idx * 15;
      params.push(
        r.full_name, r.name, r.owner, r.github_id ?? null, r.stars, r.forks,
        r.language, r.description, r.topics, r.license_key,
        r.archived ? 1 : 0, r.pushed_at, r.github_updated_at, now, now
      );
      values.push(`($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},$${base + 9},$${base + 10},$${base + 11},$${base + 12},$${base + 13},$${base + 14},$${base + 15})`);
    });
    const res = await db.query(
      `INSERT INTO "LongTailRepo"
        (full_name, name, owner, github_id, stars, forks, language, description, topics, license_key, archived, pushed_at, github_updated_at, first_seen_at, last_seen_at)
       VALUES ${values.join(',')}
       ON CONFLICT (full_name) DO UPDATE SET
         name = EXCLUDED.name, owner = EXCLUDED.owner, github_id = EXCLUDED.github_id,
         stars = EXCLUDED.stars, forks = EXCLUDED.forks, language = EXCLUDED.language,
         description = EXCLUDED.description, topics = EXCLUDED.topics, license_key = EXCLUDED.license_key,
         archived = EXCLUDED.archived, pushed_at = EXCLUDED.pushed_at,
         github_updated_at = EXCLUDED.github_updated_at, last_seen_at = EXCLUDED.first_seen_at
       RETURNING xmax`,
      params
    );
    for (const row of res.rows || []) {
      if (Number(row.xmax) === 0) inserted++;
      else updated++;
    }
  }
  return { inserted, updated, skippedKnown, skippedJunk: 0 };
}

/** Search the compact tier (SQL fallback when RAM search misses). */
export async function searchLongTail(db, { search = '', minStars = 0, language = '', page = 1, perPage = 24 }) {
  const where = [];
  const params = [];
  let i = 1;
  if (search && String(search).trim().length >= 2) {
    const term = `%${String(search).trim().toLowerCase()}%`;
    where.push(`(lower(full_name) LIKE $${i} OR lower(coalesce(name, '')) LIKE $${i})`);
    params.push(term);
    i++;
  }
  if (minStars > 0) { where.push(`stars >= $${i}`); params.push(minStars); i++; }
  if (language) { where.push(`language ILIKE $${i}`); params.push(language); i++; }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(perPage, 10) || 24));
  const off = (pageNum - 1) * limitNum;
  const countRes = await db.query(`SELECT count(*)::bigint AS total FROM "LongTailRepo" ${whereSql}`, params);
  const dataRes = await db.query(
    `SELECT full_name, name, owner, stars, forks, language, description, topics, license_key, pushed_at, github_updated_at
       FROM "LongTailRepo" ${whereSql} ORDER BY stars DESC LIMIT ${limitNum} OFFSET ${off}`,
    params
  );
  const total = Number(countRes.rows[0].total) || 0;
  return {
    results: dataRes.rows.map(r => ({
      id: `lt-${r.full_name.replace(/[^a-z0-9]/gi, '-')}`,
      full_name: r.full_name,
      name: r.name,
      owner: r.owner,
      stars: r.stars,
      forks: r.forks,
      language: r.language || '',
      description: r.description || '',
      topics: parseLongTailTopics(r.topics),
      license_key: r.license_key || '',
      html_url: `https://github.com/${r.full_name}`,
      pushed_at: r.pushed_at,
      quality_score: null,
      tier: 'longtail',
    })),
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
    perPage: limitNum,
    longTail: true,
  };
}

/**
 * Exact visible count of the long-tail tier EXCLUDING any full_name that also
 * exists in the enriched Repository tier (they are already counted by the RAM
 * catalog) — keeps the public counter truthful across both tiers.
 */
export async function countDistinctLongTail(db) {
  const r = await db.query(
    `SELECT count(*)::bigint AS n FROM "LongTailRepo" lt
      WHERE NOT EXISTS (SELECT 1 FROM "Repository" r WHERE r.full_name = lt.full_name)`
  );
  return Number(r.rows[0].n) || 0;
}

export function longTailTable() { return LONGTAIL_TABLE; }

/** Total hot rows (no Repository exclusion) — the demotion planner's input. */
export async function countLongTailTotal(db) {
  const r = await db.query(`SELECT count(*)::bigint AS n FROM "LongTailRepo"`);
  return Number(r.rows[0].n) || 0;
}

/**
 * Coldest hot rows for archival: oldest github_updated_at (NULLs first),
 * capped at the demote batch size. Rows whose full_name already exists in the
 * enriched Repository tier are skipped — they are already counted there and
 * would double-count once archived.
 */
export async function selectColdRows(db, limit) {
  const { rows } = await db.query(
    `SELECT full_name, name, owner, github_id, stars, forks, language, description,
            topics, license_key, archived, pushed_at, github_updated_at,
            first_seen_at, last_seen_at
       FROM "LongTailRepo" lt
      WHERE NOT EXISTS (SELECT 1 FROM "Repository" r WHERE r.full_name = lt.full_name)
      ORDER BY github_updated_at ASC NULLS FIRST
      LIMIT $1`,
    [limit]
  );
  return rows;
}

/** Delete archived rows after their shard is provably committed. Returns n. */
export async function deleteArchivedRows(db, fullNames) {
  if (!fullNames || fullNames.length === 0) return 0;
  const { rowCount } = await db.query(`DELETE FROM "LongTailRepo" WHERE full_name = ANY($1)`, [fullNames]);
  return rowCount || 0;
}

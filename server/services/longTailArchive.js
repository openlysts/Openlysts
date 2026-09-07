/**
 * longTailArchive.js — cold tier for the long-tail catalog.
 *
 * Neon holds the HOT rows (capped at quotaGuard.LONGTAIL_HOT_CAP); this module
 * owns the COLD tier: gzip JSON shards under server/data/longtail-archive/.
 * The daily window-cron commits new shards to git (free, versioned,
 * unbounded) BEFORE deleting the demoted rows from Neon — a crash can
 * therefore only ever re-demote, never lose a repo.
 *
 * Invariant that keeps counting exact: demoted rows are excluded from future
 * hot re-inserts (callers union getArchiveKnownSet() into their ramKnown set),
 * so a repo lives in at most one counting tier — SQL hot or cold archive.
 *
 * Hydration is lazy: only search and the demote path read shards; the visible
 * counter uses the tiny state.json fast path so stats pings never touch git
 * contents at request time.
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const gzipAsync = promisify(zlib.gzip);
const gunzipAsync = promisify(zlib.gunzip);

export const ARCHIVE_DIR_NAME = 'longtail-archive';
export const SHARD_MAX_ROWS = 50_000;

// ── Lazy RAM state ───────────────────────────────────────────────────────
let archiveRows = null;       // Map<full_name, row> — hydrated on demand
let hydratePromise = null;

function archiveDir() {
  const here = path.dirname(fileURLToPath(import.meta.url)); // server/services
  return path.join(here, '..', 'data', ARCHIVE_DIR_NAME);
}

function listShards() {
  try {
    return fs.readdirSync(archiveDir())
      .filter(f => /^part-\d{5}\.json\.gz$/.test(f))
      .sort();
  } catch {
    return [];
  }
}

// Shards store rows as compact arrays — ~40% smaller than objects gzipped.
function decodeShardRow(r) {
  const full = r[0];
  const slash = full.indexOf('/');
  return {
    full_name: full, name: r[1], owner: r[2] || (slash > 0 ? full.slice(0, slash) : ''),
    github_id: r[3] ?? null, stars: r[4] || 0, forks: r[5] || 0,
    language: r[6] || null, description: r[7] || null,
    topics: r[8] ? String(r[8]).split('|').filter(Boolean) : [],
    license_key: r[9] || null, archived: r[10] ? 1 : 0,
    pushed_at: r[11] || null, github_updated_at: r[12] || null,
    first_seen_at: r[13], last_seen_at: r[14],
  };
}

function encodeShardRow(r) {
  return [
    r.full_name, r.name, r.owner || '', r.github_id ?? null,
    r.stars || 0, r.forks || 0, r.language || null, r.description || null,
    r.topics || null, r.license_key || null, r.archived ? 1 : 0,
    r.pushed_at || null, r.github_updated_at || null, r.first_seen_at, r.last_seen_at,
  ];
}

async function hydrate() {
  if (archiveRows) return archiveRows;
  if (!hydratePromise) {
    hydratePromise = (async () => {
      const map = new Map();
      for (const shard of listShards()) {
        try {
          const buf = await gunzipAsync(fs.readFileSync(path.join(archiveDir(), shard)));
          const parsed = JSON.parse(buf.toString('utf8'));
          const rows = Array.isArray(parsed) ? parsed : (parsed.rows || []);
          for (const r of rows) {
            const row = decodeShardRow(r);
            if (row.full_name && !map.has(row.full_name)) map.set(row.full_name, row);
          }
        } catch (e) {
          // A corrupt/absent shard never breaks the app — it just doesn't count.
          console.warn(`[longTailArchive] shard ${shard} unreadable:`, e.message);
        }
      }
      archiveRows = map;
      return map;
    })();
  }
  try {
    return await hydratePromise;
  } finally {
    hydratePromise = null;
  }
}

function countFromStateFiles() {
  // Persisted by the demote script so read paths never need fs/git scans.
  try {
    const state = JSON.parse(fs.readFileSync(path.join(archiveDir(), 'state.json'), 'utf8'));
    const n = Number(state.totalArchived);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/** Count of cold-tier repos (state fast path; falls back to shard hydration). */
export async function getArchiveCount() {
  const fromState = countFromStateFiles();
  if (fromState !== null) return fromState;
  const map = await hydrate();
  return map.size;
}

/** Lowercased full_names in the archive — callers union into ramKnown so
 *  re-discovered repos are never re-inserted hot (counting stays exact). */
export async function getArchiveKnownSet() {
  const map = await hydrate();
  return new Set([...map.keys()].map(n => n.toLowerCase()));
}

/**
 * Exact cold count EXCLUDING repos also present in the enriched Repository
 * tier (a repo enriched AFTER its demotion would otherwise double-count).
 * Returns null when shards are not hydrated yet — the caller falls back to
 * the raw state-count; hydration happens on first search, after which stats
 * are exact.
 */
export function getArchiveDistinctCount(ramKnown) {
  if (archiveRows === null || !ramKnown) return null;
  let distinct = 0;
  for (const name of archiveRows.keys()) {
    if (!ramKnown.has(name.toLowerCase())) distinct++;
  }
  return distinct;
}

/**
 * Search the cold tier (case-insensitive substring on full_name/name/topic).
 * Rows come back stars-desc; shape matches searchLongTail results.
 */
export async function searchArchive(q, { language = '', minStars = 0, limit = 24, offset = 0 } = {}) {
  const term = String(q || '').trim().toLowerCase();
  if (term.length < 2) return { results: [], total: 0 };
  const map = await hydrate();
  const hits = [];
  for (const row of map.values()) {
    if (row.stars < minStars) continue;
    if (language && String(row.language || '').toLowerCase() !== String(language).toLowerCase()) continue;
    if (
      row.full_name.toLowerCase().includes(term) ||
      String(row.name || '').toLowerCase().includes(term) ||
      row.topics.some(t => t.toLowerCase().includes(term))
    ) {
      hits.push(row);
    }
  }
  hits.sort((a, b) => b.stars - a.stars);
  return {
    results: hits.slice(offset, offset + limit).map(r => ({
      id: `lt-${r.full_name.replace(/[^a-z0-9]/gi, '-')}`,
      full_name: r.full_name,
      name: r.name,
      owner: r.owner,
      stars: r.stars,
      forks: r.forks,
      language: r.language || '',
      description: r.description || '',
      topics: r.topics,
      license_key: r.license_key || '',
      html_url: `https://github.com/${r.full_name}`,
      pushed_at: r.github_updated_at || r.pushed_at || null,
      quality_score: null,
      tier: 'archive',
    })),
    total: hits.length,
  };
}

/**
 * Demote cold rows OUT of Neon INTO new shard files on disk. The caller (cron
 * script) commits the shard files + state to git, and only then calls
 * longTailRepo.deleteArchivedRows — commit-before-delete is the safety net.
 * Rows come from selectColdRows (already excludes enriched-tier duplicates).
 *
 * @returns {{ shards: Array<{file, rows}>, allNames: string[], bytes: number }}
 */
export async function demoteToShardFiles(rows) {
  if (!rows || rows.length === 0) return { shards: [], allNames: [], bytes: 0 };
  const dir = archiveDir();
  fs.mkdirSync(dir, { recursive: true });
  const existing = listShards();
  let nextIndex = existing.length
    ? parseInt(existing[existing.length - 1].match(/\d{5}/)[0], 10) + 1
    : 0;

  const shards = [];
  let bytes = 0;
  for (let i = 0; i < rows.length; i += SHARD_MAX_ROWS) {
    const slice = rows.slice(i, i + SHARD_MAX_ROWS).map(encodeShardRow);
    const gz = await gzipAsync(Buffer.from(JSON.stringify(slice), 'utf8'), { level: 9 });
    const file = `part-${String(nextIndex++).padStart(5, '0')}.json.gz`;
    fs.writeFileSync(path.join(dir, file), gz);
    bytes += gz.length;
    shards.push({ file, rows: slice.length });
  }
  return { shards, allNames: rows.map(r => r.full_name), bytes };
}

/** Record a completed demotion (counts + history) into state.json. */
export function writeArchiveState({ added, shards, demotedAt }) {
  const dir = archiveDir();
  fs.mkdirSync(dir, { recursive: true });
  let state = {};
  try {
    state = JSON.parse(fs.readFileSync(path.join(dir, 'state.json'), 'utf8'));
  } catch { /* first demote */ }
  state.totalArchived = (Number(state.totalArchived) || 0) + (Number(added) || 0);
  state.lastDemoteAt = demotedAt || null;
  state.demoteHistory = Array.isArray(state.demoteHistory) ? state.demoteHistory : [];
  if (demotedAt) {
    state.demoteHistory.push({ at: demotedAt, rows: added, shards: shards || [] });
    state.demoteHistory = state.demoteHistory.slice(-50);
  }
  fs.writeFileSync(path.join(dir, 'state.json'), JSON.stringify(state, null, 2));
  return state;
}

/** Test/ops hook: drop the lazy RAM state (next read re-hydrates). */
export function resetArchiveCache() {
  archiveRows = null;
  hydratePromise = null;
}

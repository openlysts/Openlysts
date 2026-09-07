/**
 * altGraph.js
 * Alternatives Knowledge Graph — the curated layer that turns Openlysts from a
 * "similar repos" engine into an evidence-backed alternatives directory.
 *
 * Graph model: SUBJECT (a tool the user may pay for / already uses) → typed
 * edge → CANDIDATE (a free/open or better alternative). Every edge carries
 * evidence (source URL + date), a source kind, a confidence score and a
 * verification status so "real-time, never junk" is a verifiable claim:
 *
 *   status: verified  — candidate resolves to a real repo/product record
 *           pending   — waiting for verification (community suggestions, new)
 *           junk      — failed the junk gate (archived/spam/malformed)
 *
 * Sources wired in (see altSources.js): seed (curated), awesome (parsed
 * awesome-oss-alternatives), catalog (backfill of the curated Neon
 * Alternative rows), community (user suggestions via API), demand (auto-queued
 * from real user searches). Votes come from the public vote API.
 *
 * Tables are self-healing (idempotent CREATE) matching the collections-module
 * precedent — schema.js bootstrap is CLI-only in this project.
 */

import crypto from 'crypto';

export const RELATIONS = new Set(['alternative', 'successor', 'migrate_to']);
export const SOURCES = new Set(['seed', 'awesome', 'catalog', 'community', 'demand']);

// ── Pure helpers (unit-testable offline) ────────────────────────────────

/** Normalize a subject/candidate into its lookup key. */
export function normalizeKey(text) {
  if (!text) return '';
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/^(the|a|an)\s+/, '')
    .replace(/[^a-z0-9+.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Split "alternatives to X / open source X alternatives / vs Y" titles. */
export function subjectFromQuery(raw) {
  if (!raw) return '';
  let t = String(raw).trim();
  t = t.replace(/\balternatives?\s+(?:to|for|of)\b/gi, '');
  t = t.replace(/\s+alternatives?$/i, '');
  t = t.replace(/\bopen[- ]?source\b/gi, '');
  t = t.replace(/\b(?:free|best|top|good|paid|proprietary)\s+/gi, '');
  t = t.replace(/\bvs\.?$/i, '');
  t = t.replace(/[?¿]/g, '').trim();
  if (!t) return '';
  return t.split(/\s+/).slice(0, 4).join(' ');
}

// Token list that indicates a candidate row is spam/noise, not a tool.
const JUNK_TOKENS = [
  'crypto', 'bitcoin', 'airdrop', 'mining', 'porn', 'xxx', 'casino',
  'gambling', 'sniper', 'cheat', 'hack tool', 'free followers',
  'earn money', 'make money', 'get rich', 'nft',
];
const JUNK_NAME_PATTERNS = [
  /^awesome[-_ ]list/i, /^awesome[-_ ]/, /[-_ ](?:clone|tutorial|course|cheatsheet)$/i,
  /^[0-9]{4}[-_ ]/, /^learn[-_ ]/i, /test[-_ ]?repo/i, /^hello[-_ ]?world/i,
];

/**
 * Pure junk gate. A candidate is junk when it is archived, spammy, or
 * structurally invalid; otherwise it passes with a confidence adjusted by the
 * evidence source.
 */
export function junkGate(candidate, { archived = false, source = 'community' } = {}) {
  if (!candidate || typeof candidate !== 'object') return { junk: true, reason: 'malformed' };
  const name = candidate.name || candidate.full_name || candidate.candidate_name || '';
  const lowerName = String(name).toLowerCase();
  if (archived) return { junk: true, reason: 'archived' };
  const trimmed = String(name).trim();
  if (trimmed.length < 2 || trimmed.length > 70 || !/^[\w.+\- ]{2,70}$/.test(trimmed)) {
    return { junk: true, reason: 'malformed_name' };
  }
  // Space-normalized haystack so hyphenated spam still matches multi-word tokens
  // ("free-instagram-followers" → "free instagram followers" hits "free followers").
  const hay = lowerName.replace(/[^a-z0-9]+/g, ' ');
  for (const tok of JUNK_TOKENS) {
    if (hay.includes(tok)) return { junk: true, reason: `spam_token:${tok}` };
  }
  for (const pat of JUNK_NAME_PATTERNS) {
    if (pat.test(String(name))) return { junk: true, reason: `pattern:${pat}` };
  }
  if (candidate.stars !== undefined && Number(candidate.stars) < 5 && source === 'demand') {
    return { junk: true, reason: 'too_obscure_for_demand' };
  }
  const baseConfidence = source === 'seed' ? 0.95
    : source === 'awesome' ? 0.9
      : source === 'catalog' ? 0.9
        : source === 'community' ? 0.4
          : source === 'demand' ? 0.55 : 0.5;
  return { junk: false, confidence: baseConfidence, reason: '' };
}

/** Unique constraint key for one edge direction. */
export function edgeKey(subjectKey, candidateKey, relation, source) {
  return `${subjectKey}||${candidateKey}||${relation}||${source}`.slice(0, 240);
}

// ── Schema ──────────────────────────────────────────────────────────────

export async function ensureAltGraphTables(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS "AltGraph" (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      subject_key TEXT NOT NULL,
      subject_kind TEXT NOT NULL DEFAULT 'product',
      candidate_name TEXT NOT NULL,
      candidate_full_name TEXT,
      candidate_url TEXT,
      relation TEXT NOT NULL DEFAULT 'alternative',
      source TEXT NOT NULL,
      evidence_url TEXT,
      evidence_title TEXT,
      votes_up INTEGER NOT NULL DEFAULT 0,
      votes_down INTEGER NOT NULL DEFAULT 0,
      confidence REAL NOT NULL DEFAULT 0.5,
      status TEXT NOT NULL DEFAULT 'pending',
      junk_reason TEXT,
      voter_ips TEXT[] NOT NULL DEFAULT '{}',
      voter_ids TEXT[] NOT NULL DEFAULT '{}',
      voter_log TEXT[] NOT NULL DEFAULT '{}',
      suggested_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_verified_at TEXT
    );
  `);
  // Existing tables created before voter tracking get the columns backfilled.
  await db.query(`ALTER TABLE "AltGraph" ADD COLUMN IF NOT EXISTS voter_ips TEXT[] NOT NULL DEFAULT '{}';`);
  await db.query(`ALTER TABLE "AltGraph" ADD COLUMN IF NOT EXISTS voter_ids TEXT[] NOT NULL DEFAULT '{}';`);
  await db.query(`ALTER TABLE "AltGraph" ADD COLUMN IF NOT EXISTS voter_log TEXT[] NOT NULL DEFAULT '{}';`);
  await db.query(`ALTER TABLE "AltGraph" ADD COLUMN IF NOT EXISTS suggested_by TEXT;`);
  // Dedupe on candidate identity: repo full_name when present, else its URL —
  // a NULL candidate_full_name (non-GitHub product) must still dedupe.
  await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_altgraph_edge ON "AltGraph"
    (subject_key, (COALESCE(candidate_full_name, candidate_url)), relation, source);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_altgraph_subject ON "AltGraph"(subject_key, status);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_altgraph_status ON "AltGraph"(status, votes_up DESC);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_altgraph_candidate ON "AltGraph"(candidate_full_name);`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS "SubjectQueue" (
      key TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'demand',
      demand INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'open',
      last_queued_at TEXT NOT NULL,
      last_processed_at TEXT,
      last_result TEXT
    );
  `);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_subjectq_status ON "SubjectQueue"(status, demand DESC);`);
}

// ── Edge CRUD ───────────────────────────────────────────────────────────

/**
 * Insert or refresh one edge. Returns { edge, created }.
 * Dedupe key = subject_key + candidate_full_name + relation + source.
 */
export async function upsertEdge(db, edge, { verify = null } = {}) {
  const subjectKey = normalizeKey(edge.subject);
  const candidateKey = normalizeKey(edge.candidate_name);
  if (!subjectKey || !candidateKey) return null;
  const relation = RELATIONS.has(edge.relation) ? edge.relation : 'alternative';
  const source = SOURCES.has(edge.source) ? edge.source : 'community';
  const fullName = (edge.candidate_full_name || '').trim() || null;
  const candidateUrl = (edge.candidate_url || '').trim() || null;
  const gate = junkGate(
    { name: edge.candidate_name, stars: edge.candidate_stars, full_name: fullName },
    { archived: edge.candidate_archived, source }
  );
  const now = new Date().toISOString();

  const id = edge.id || `g-${crypto.randomBytes(8).toString('hex')}`;
  const res = await db.query(
    `INSERT INTO "AltGraph"
      (id, subject, subject_key, subject_kind, candidate_name, candidate_full_name, candidate_url,
       relation, source, evidence_url, evidence_title, votes_up, votes_down, confidence, status, junk_reason, created_at, updated_at, last_verified_at, suggested_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
     ON CONFLICT (subject_key, (COALESCE(candidate_full_name, candidate_url)), relation, source) DO UPDATE SET
       subject = EXCLUDED.subject, candidate_name = EXCLUDED.candidate_name,
       candidate_url = EXCLUDED.candidate_url, evidence_url = EXCLUDED.evidence_url,
       evidence_title = EXCLUDED.evidence_title, confidence = EXCLUDED.confidence,
       status = CASE
         WHEN "AltGraph".status = 'verified' THEN 'verified'
         WHEN "AltGraph".status = 'junk' THEN 'junk'
         ELSE EXCLUDED.status END,
       updated_at = EXCLUDED.updated_at, junk_reason = EXCLUDED.junk_reason
     RETURNING id, status, votes_up, votes_down, subject_key, candidate_full_name`,
    [
      id, edge.subject, subjectKey, edge.subject_kind || 'product', edge.candidate_name,
      fullName, candidateUrl, relation, source, edge.evidence_url || null, edge.evidence_title || null,
      Number(edge.votes_up) || 0, Number(edge.votes_down) || 0,
      gate.junk ? 0.1 : (edge.confidence || gate.confidence),
      gate.junk ? 'junk' : (edge.status || 'pending'),
      gate.junk ? gate.reason : null, now, now,
      verify === true ? now : edge.last_verified_at || null,
      edge.suggested_by || null,
    ]
  );
  const row = res.rows[0];
  return { edge: row ? { ...row, subject: edge.subject, candidate_name: edge.candidate_name } : null, created: res.rowCount > 0 };
}

/** Upsert an edge but never override an existing verified/junk verdict. */
export async function upsertEdgeKeepVerdict(db, edge) {
  return upsertEdge(db, edge);
}

/** Batch upsert many edges (source pipelines). */
export async function upsertEdges(db, edges, { verify = null } = {}) {
  let created = 0, updated = 0, junked = 0, skipped = 0;
  for (const e of edges) {
    if (!e || !normalizeKey(e.subject) || !normalizeKey(e.candidate_name)) { skipped++; continue; }
    const r = await upsertEdge(db, e, { verify });
    if (!r) { skipped++; continue; }
    if (r.created) created++; else updated++;
    if (r.edge && r.edge.status === 'junk') junked++;
  }
  return { created, updated, junked, skipped, total: edges.length };
}

/**
 * Batch INSERT … ON CONFLICT DO NOTHING — for bulk curated sources (seed,
 * catalog backfill, awesome parses) where re-runs must NOT churn updated_at
 * on every row (keeps Neon write volume near zero on refresh cycles).
 */
// Multi-row chunked bulk insert: Neon round-trips are ~1-2 s per statement, so
// 1,800 sequential inserts would take ~an hour. Chunk 25 rows/statement — the
// same batching runIngestion already uses to stay inside Neon's latency and
// write budget.
const ALTGRAPH_COLS = [
  'id', 'subject', 'subject_key', 'subject_kind', 'candidate_name', 'candidate_full_name',
  'candidate_url', 'relation', 'source', 'evidence_url', 'evidence_title', 'confidence',
  'status', 'junk_reason', 'created_at', 'updated_at', 'last_verified_at',
];
const N_COLS = ALTGRAPH_COLS.length;

export async function upsertEdgesFresh(db, edges, { verify = null } = {}) {
  let created = 0, skipped = 0;
  const now = new Date().toISOString();
  const ready = [];
  for (const e of edges) {
    if (!e || !normalizeKey(e.subject) || !normalizeKey(e.candidate_name)) { skipped++; continue; }
    const subjectKey = normalizeKey(e.subject);
    const relation = RELATIONS.has(e.relation) ? e.relation : 'alternative';
    const source = SOURCES.has(e.source) ? e.source : 'community';
    const fullName = (e.candidate_full_name || '').trim() || null;
    const candidateUrl = (e.candidate_url || '').trim() || null;
    const gate = junkGate({ name: e.candidate_name, stars: e.candidate_stars, full_name: fullName },
      { archived: e.candidate_archived, source });
    if (gate.junk) { skipped++; continue; }
    ready.push([
      `g-${crypto.randomBytes(8).toString('hex')}`, e.subject, subjectKey, e.subject_kind || 'product',
      e.candidate_name, fullName, candidateUrl, relation, source, e.evidence_url || null,
      e.evidence_title || null, gate.junk ? 0.1 : (e.confidence || gate.confidence),
      gate.junk ? 'junk' : (e.status || 'pending'), gate.junk ? gate.reason : null, now, now,
      verify === true ? now : null,
    ]);
  }
  const CHUNK = 250;
  for (let i = 0; i < ready.length; i += CHUNK) {
    const chunk = ready.slice(i, i + CHUNK);
    const params = [];
    const rows = [];
    chunk.forEach((row, idx) => {
      const base = idx * N_COLS;
      row.forEach((v, j) => params.push(v));
      rows.push(`(${row.map((_, j) => `$${base + j + 1}`).join(',')})`);
    });
    const res = await db.query(
      `INSERT INTO "AltGraph" (${ALTGRAPH_COLS.join(',')}) VALUES ${rows.join(',')}
       ON CONFLICT (subject_key, (COALESCE(candidate_full_name, candidate_url)), relation, source) DO NOTHING`,
      params
    );
    created += res.rowCount;
  }
  return { created, skipped, total: edges.length };
}

// A pending community edge earns 'verified' only when several distinct
// people agree: ≥ 3 distinct voters, net votes ≥ +2 and a clear up majority.
// This is what lets demand/community edges graduate to the graph WITHOUT a
// human reviewer — while one user alone (or one IP flood) can never promote.
const PROMOTE_MIN_DISTINCT_VOTERS = 3;
const PROMOTE_MIN_NET = 2;
const PROMOTE_MIN_UP = 3;

// If an edge later loses the crowd's trust, verification is revoked.
const DEMOTE_MAX_NET = -2;

export function promotionEligible(row) {
  if (!row || row.status === 'junk') return false;
  // Distinct voters = logged-in user ids (voter_ids) + anonymous IPs (voter_ips).
  // A single vote lands in exactly one array, so summing never double-counts.
  const userVoters = Array.isArray(row.voter_ids) ? row.voter_ids.filter(Boolean).length : 0;
  const ipVoters = Array.isArray(row.voter_ips)
    ? row.voter_ips.filter(Boolean).length
    : (Number(row.distinct_voters) || 0);
  const distinct = userVoters + ipVoters;
  const up = Number(row.votes_up) || 0;
  const down = Number(row.votes_down) || 0;
  const net = up - down;
  if (row.status === 'pending') {
    return distinct >= PROMOTE_MIN_DISTINCT_VOTERS && net >= PROMOTE_MIN_NET && up >= PROMOTE_MIN_UP;
  }
  if (row.status === 'verified') {
    return net <= DEMOTE_MAX_NET; // lost trust → revoke
  }
  return false;
}

/**
 * Public vote: +1/-1 on an edge, clamped at zero. Records the voter's IP so
 * promotion requires a real quorum; promotes/revokes inline when thresholds
 * are met, so the graph stays self-healing between scheduled sweeps.
 */
export async function voteEdge(db, edgeId, dir, ip = null, userId = null) {
  // Each click adds +1 to the target column — a downvote must increment
  // votes_down, never decrement it (GREATEST(0, col - 1) silently ate every
  // downvote, which kept demotion permanently dead).
  const col = dir > 0 ? 'votes_up' : 'votes_down';
  const now = new Date().toISOString();
  const ipText = ip ? String(ip).slice(0, 64) : null;
  const uid = userId ? String(userId).slice(0, 64) : null;
  // voter_log records every click as `${key}:${dir}` so the UI can highlight
  // the voter's own direction (last click wins) without changing the quorum
  // math, which still counts voter_ids (users) + voter_ips (anonymous).
  const logKey = uid ? `u:${uid}:${dir}` : (ipText ? `ip:${ipText}:${dir}` : null);
  const res = await db.query(
    `UPDATE "AltGraph" SET ${col} = ${col} + 1, updated_at = $2,
       voter_ips = CASE WHEN $3::text IS NULL OR $3 = ANY(voter_ips) THEN voter_ips ELSE voter_ips || $3 END,
       voter_ids = CASE WHEN $4::text IS NULL OR $4 = ANY(voter_ids) THEN voter_ids ELSE voter_ids || $4 END,
       voter_log = CASE WHEN $5::text IS NULL THEN voter_log ELSE voter_log || $5 END
     WHERE id = $1 RETURNING id, votes_up, votes_down, status, voter_ips, voter_ids, voter_log, confidence, source, suggested_by`,
    [edgeId, now, ipText, uid, logKey]
  );
  const edge = res.rows[0] || null;
  if (!edge) return null;

  if (promotionEligible(edge) && edge.status === 'pending') {
    const promote = await db.query(
      `UPDATE "AltGraph" SET status = 'verified', last_verified_at = $2, updated_at = $2 WHERE id = $1 AND status = 'pending'
       RETURNING id, status, votes_up, votes_down, last_verified_at`,
      [edgeId, now]
    );
    if (promote.rows[0]) Object.assign(edge, promote.rows[0]);
  } else if (promotionEligible(edge) && edge.status === 'verified') {
    const demote = await db.query(
      `UPDATE "AltGraph" SET status = 'pending', updated_at = $2 WHERE id = $1 AND status = 'verified'
       RETURNING id, status`,
      [edgeId, now]
    );
    if (demote.rows[0]) Object.assign(edge, demote.rows[0]);
  }
  return edge;
}

/**
 * Scheduled sweep: promote pending edges that crossed the quorum threshold
 * and revoke verified edges the community has since rejected. The daily
 * growth cron runs this so backfilled/old edges self-verify over time.
 */
export async function promotionSweep(db, { limit = 200 } = {}) {
  const now = new Date().toISOString();
  const cap = Math.max(1, limit);
  const promoted = await db.query(
    `UPDATE "AltGraph" SET status = 'verified', last_verified_at = $1, updated_at = $1
     WHERE id IN (SELECT id FROM "AltGraph"
        WHERE status = 'pending' AND array_length(voter_ips, 1) >= 3
          AND (votes_up - votes_down) >= 2 AND votes_up >= 3
        LIMIT $2)
     RETURNING id`,
    [now, cap]
  );
  const revoked = await db.query(
    `UPDATE "AltGraph" SET status = 'pending', updated_at = $1
     WHERE id IN (SELECT id FROM "AltGraph"
        WHERE status = 'verified' AND (votes_up - votes_down) <= -2
        LIMIT $2)
     RETURNING id`,
    [now, cap]
  );
  return {
    promoted: promoted.rowCount || 0,
    revoked: revoked.rowCount || 0,
    promotedIds: promoted.rows.map(r => r.id),
    revokedIds: revoked.rows.map(r => r.id),
  };
}

/**
 * Graph context for a repository detail page: edges that name this repo as a
 * candidate alternative (incoming: "this repo is an alternative to X") and,
 * when the repo name itself is a subject, edges that point away from it
 * (outgoing: "alternatives to this repo"). Verified edges first; pending edges
 * included so the UI can surface community votes.
 */
export async function graphForRepo(db, repoFullName, repoName = '', { limit = 6 } = {}) {
  const fullName = String(repoFullName || '').trim();
  const incomingKeys = fullName ? [fullName.toLowerCase()] : [];
  const subjectKeys = [];
  const nameKey = normalizeKey(repoName || '');
  const fullKey = normalizeKey(fullName);
  if (nameKey) subjectKeys.push(nameKey);
  if (fullKey && fullKey !== nameKey) subjectKeys.push(fullKey);

  const incoming = [];
  if (incomingKeys.length > 0) {
    const res = await db.query(
      `SELECT * FROM "AltGraph"
       WHERE LOWER(candidate_full_name) = $1
       ORDER BY (status = 'verified') DESC, votes_up DESC, confidence DESC
       LIMIT $2`,
      [incomingKeys[0], Math.min(50, limit || 6)]
    );
    incoming.push(...res.rows);
  }

  const outgoing = [];
  if (subjectKeys.length > 0) {
    const res = await db.query(
      `SELECT * FROM "AltGraph"
       WHERE subject_key = ANY($1::text[])
       ORDER BY (status = 'verified') DESC, votes_up DESC, confidence DESC
       LIMIT $2`,
      [subjectKeys, Math.min(50, limit || 6)]
    );
    outgoing.push(...res.rows);
  }

  return {
    incoming: incoming.filter(e => e.status === 'verified'),
    incomingPending: incoming.filter(e => e.status === 'pending'),
    outgoing: outgoing.filter(e => e.status === 'verified'),
    outgoingPending: outgoing.filter(e => e.status === 'pending'),
  };
}

/** Verified edges for a subject key, best first. */
export async function edgesForSubject(db, subjectKey, { limit = 10, includePending = false } = {}) {
  const status = includePending ? `status IN ('verified','pending')` : `status = 'verified'`;
  const res = await db.query(
    `SELECT * FROM "AltGraph" WHERE subject_key = $1 AND ${status}
     ORDER BY votes_up DESC, confidence DESC, created_at DESC LIMIT $2`,
    [subjectKey, Math.min(50, limit || 10)]
  );
  return res.rows;
}

export async function edgeCounts(db) {
  const res = await db.query(
    `SELECT status, source, count(*)::bigint AS n FROM "AltGraph" GROUP BY status, source ORDER BY status, source`
  );
  const summary = { byStatus: {}, bySource: {}, total: 0 };
  for (const r of res.rows) {
    summary.byStatus[r.status] = (summary.byStatus[r.status] || 0) + Number(r.n);
    summary.bySource[r.source] = (summary.bySource[r.source] || 0) + Number(r.n);
    summary.total += Number(r.n);
  }
  return summary;
}

// ── Demand queue (the auto-queue loop) ─────────────────────────────────

/**
 * Record a real user search that found nothing / almost nothing. Throttled:
 * a subject only re-counts 15 minutes after its previous count, so a hot
 * subject never spams the queue (and never spams Neon writes).
 */
export async function captureDemand(db, rawSubject, source = 'demand') {
  const subject = subjectFromQuery(rawSubject);
  const key = normalizeKey(subject);
  if (!key || key.length < 2) return null;
  const now = new Date().toISOString();

  // Create when absent (best-effort; racing writers on serverless are fine —
  // the throttle below still bounds the write rate per subject).
  await db.query(
    `INSERT INTO "SubjectQueue" (key, subject, source, demand, status, last_queued_at)
     VALUES ($1,$2,$3,1,'open',$4) ON CONFLICT (key) DO NOTHING`,
    [key, subject, source, now]
  );

  const sel = await db.query(
    `SELECT key, demand, last_queued_at FROM "SubjectQueue" WHERE key = $1`, [key]
  );
  const row = sel.rows[0];
  if (!row) return null;

  // Only increment demand when the last queue event is older than 15 min.
  const last = new Date(row.last_queued_at).getTime();
  if (Date.now() - last < 15 * 60 * 1000) {
    return { key, throttled: true, demand: Number(row.demand) };
  }
  await db.query(
    `UPDATE "SubjectQueue" SET demand = demand + 1, last_queued_at = $2 WHERE key = $1`,
    [key, now]
  );
  return { key, throttled: false };
}

export async function dequeueSubjects(db, limit = 5) {
  const res = await db.query(
    `UPDATE "SubjectQueue" SET status = 'processing', last_processed_at = $2
     WHERE key IN (
       SELECT key FROM "SubjectQueue" WHERE status = 'open'
       ORDER BY demand DESC, last_queued_at ASC LIMIT $1
     )
     RETURNING key, subject, source, demand`,
    [limit, new Date().toISOString()]
  );
  return res.rows;
}

export async function finishSubject(db, key, result, status = 'done') {
  await db.query(
    `UPDATE "SubjectQueue" SET status = $2, last_result = $3 WHERE key = $1`,
    [key, status, result ? JSON.stringify(result).slice(0, 500) : null]
  );
}

export async function queueStatus(db) {
  const res = await db.query(
    `SELECT status, count(*)::bigint AS n FROM "SubjectQueue" GROUP BY status ORDER BY status`
  );
  return res.rows.map(r => ({ status: r.status, count: Number(r.n) }));
}

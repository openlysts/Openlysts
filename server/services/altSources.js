/**
 * altSources.js
 * The five wired discovery sources that grow the Alternatives Knowledge Graph.
 * Every edge carries evidence (URL + title) and every run is bounded by
 * quotaGuard so no cycle can blow GitHub/Neon free limits.
 *
 *  1. seed      — curated bootstrap list (server/data/altgraph_seed.json)
 *  2. catalog   — backfill of the curated Neon `Alternative` rows (paid→free)
 *  3. awesome   — parsed awesome-oss-alternatives README (evidence = the list)
 *  4. community — user submissions via POST /api/altgraph/suggest
 *  5. demand    — auto-queued from real user searches, resolved with a
 *                 bounded GitHub search per queued subject
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeKey, subjectFromQuery, upsertEdgesFresh, upsertEdge, dequeueSubjects, finishSubject, junkGate } from './altGraph.js';
import { quotaGuard } from './quotaGuard.js';
import { tokenRotation } from './tokenRotation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SEED_PATH = path.join(__dirname, '..', 'data', 'altgraph_seed.json');

const GITHUB_API = 'https://api.github.com';
const AWESOME_ALT_URL = 'https://raw.githubusercontent.com/RunaCapital/awesome-oss-alternatives/master/README.md';
const UA = { 'User-Agent': 'Openlysts-Alternatives-Graph', Accept: 'application/vnd.github+json' };

// ── 1. Seed ─────────────────────────────────────────────────────────────

export function loadSeedEdges() {
  let rows = [];
  try {
    rows = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
  } catch (e) {
    console.error('[ALTGRAPH] seed load failed:', e.message);
  }
  return rows.map(r => ({
    subject: r.subject,
    candidate_name: r.candidate_name,
    candidate_full_name: r.candidate_full_name || '',
    candidate_url: r.candidate_url || '',
    relation: r.relation || 'alternative',
    source: 'seed',
    evidence_url: r.evidence_url,
    evidence_title: r.evidence_title,
    status: r.status || 'pending',
    confidence: 0.95,
  }));
}

/** Seed the graph (idempotent, no-touch). */
export async function ingestSeed(db) {
  const edges = loadSeedEdges();
  const res = await upsertEdgesFresh(db, edges);
  console.log(`[ALTGRAPH] seed: ${res.created} created, ${res.skipped} skipped`);
  return res;
}

// ── 2. Catalog backfill (curated Neon Alternative rows) ─────────────────

/**
 * RunaCapital/awesome-oss-alternatives is the upstream source that already
 * fed the curated Neon `Alternative` catalog. Backfilling it into the graph
 * gives thousands of verified paid→open edges in one pass.
 */
export async function ingestCatalogBackfill(db) {
  const res = await db.query(
    `SELECT paid_tool_name, free_tool_name, free_tool_repo, free_tool_url, category
       FROM "Alternative" WHERE paid_tool_name IS NOT NULL`
  );
  const edges = [];
  for (const a of res.rows) {
    const paid = (a.paid_tool_name || '').trim();
    if (!paid || paid === 'Proprietary Tool' || paid === 'Proprietary SaaS') continue;
    const repo = (a.free_tool_repo || '').trim();
    const isRepo = repo.includes('/') && !repo.startsWith('http');
    const name = (a.free_tool_name || (isRepo ? repo.split('/')[1] : repo) || 'Alternative').trim();
    if (!name || normalizeKey(name) === normalizeKey(paid)) continue;
    edges.push({
      subject: paid,
      subject_kind: 'product',
      candidate_name: name,
      candidate_full_name: isRepo ? repo : '',
      candidate_url: !isRepo ? (a.free_tool_url || (repo.startsWith('http') ? repo : '')) : (a.free_tool_url || ''),
      relation: 'alternative',
      source: 'catalog',
      evidence_url: a.free_tool_url || (isRepo ? `https://github.com/${repo}` : ''),
      evidence_title: `${name} — open-source alternative to ${paid}`,
      status: 'verified',
      confidence: 0.9,
    });
  }
  // Cap per run — bulk insert is chunked inside the store, keep memory light.
  const res2 = await upsertEdgesFresh(db, edges.slice(0, 5000));
  console.log(`[ALTGRAPH] catalog backfill: ${edges.length} candidates → ${res2.created} created`);
  return { ...res2, candidates: edges.length };
}

// ── 3. Awesome list parser (evidence-backed) ────────────────────────────

/**
 * Pure parser for the awesome-oss-alternatives README format:
 *   ## [Subject](url)                       ← heading = the paid tool
 *   - [Alt One](https://github.com/o/n) — description   (or | Alt Two ...)
 */
export function parseAwesomeAltMarkdown(md) {
  const edges = [];
  let currentSubject = null;
  const lines = String(md || '').split(/\r?\n/);
  for (const line of lines) {
    const heading = line.match(/^#+\s*\[([^\]]+)\]\(([^)]+)\)/);
    if (heading) {
      currentSubject = heading[1].trim().replace(/[•·]/g, '').trim();
      continue;
    }
    if (!currentSubject) continue;
    if (/^#+\s*/.test(line) && !heading) { currentSubject = null; continue; }
    const bullet = line.match(/^\s*[-*]\s*/);
    if (!bullet) continue;
    const content = line.slice(bullet[0].length).trim();
    if (!content) continue;
    const segs = content.split('|').map(s => s.trim());
    for (const seg of segs) {
      const nameMatch = seg.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (!nameMatch) continue;
      const name = nameMatch[1].replace(/[●*]/g, '').trim();
      const url = nameMatch[2].trim();
      if (!name || !url.startsWith('http')) continue;
      if (normalizeKey(name) === normalizeKey(currentSubject)) continue;
      const gh = url.match(/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/);
      const fullName = gh ? `${gh[1]}/${gh[2]}`.toLowerCase().replace(/\/$/, '') : '';
      edges.push({
        subject: currentSubject,
        candidate_name: name,
        candidate_full_name: fullName,
        candidate_url: gh ? '' : url,
        relation: 'alternative',
        source: 'awesome',
        evidence_url: AWESOME_ALT_URL,
        evidence_title: `awesome-oss-alternatives entry for ${currentSubject}`,
        status: 'pending',
        confidence: 0.9,
      });
    }
  }
  // Dedupe in-memory by subject+candidate to cut insert work.
  const seen = new Set();
  return edges.filter(e => {
    const k = `${normalizeKey(e.subject)}|${e.candidate_full_name || e.candidate_url}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export async function ingestAwesomeAltList(db, { fetcher = null } = {}) {
  let md;
  try {
    const doFetch = fetcher || (async (u) => {
      const res = await fetch(u, { headers: UA, signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    });
    md = await doFetch(AWESOME_ALT_URL);
  } catch (e) {
    console.warn('[ALTGRAPH] awesome fetch failed:', e.message);
    return { error: e.message, created: 0, candidates: 0 };
  }
  const edges = parseAwesomeAltMarkdown(md);
  const res = await upsertEdgesFresh(db, edges.slice(0, 3000));
  console.log(`[ALTGRAPH] awesome: ${edges.length} candidates → ${res.created} created`);
  return { ...res, candidates: edges.length };
}

// ── 5. Demand queue resolution ──────────────────────────────────────────

/**
 * Bounded GitHub search helper honouring the shared search budget.
 */
async function ghSearchWithBudget(q, fetcher) {
  quotaGuard.assertSearchBudget(1);
  const url = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=10`;
  const doFetch = fetcher || (async (u) => {
    const tokenSrc = tokenRotation.initialized ? tokenRotation.getToken() : null;
    const token = tokenSrc?.token || process.env.GITHUB_TOKEN || '';
    const headers = { ...UA };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(u, { headers, signal: AbortSignal.timeout(15000) });
    quotaGuard.noteSearchHeaders(
      res.headers.get('x-ratelimit-remaining'),
      res.headers.get('x-ratelimit-reset')
    );
    if (res.status === 403 || res.status === 429) {
      const reset = res.headers.get('x-ratelimit-reset');
      if (tokenSrc && tokenRotation.initialized) {
        tokenRotation.reportRateLimit(tokenSrc.index, reset ? parseInt(reset, 10) : undefined);
      }
      const err = new Error('GitHub search rate limited'); err.code = 'RATE_LIMITED'; throw err;
    }
    if (!res.ok) throw new Error(`GitHub search HTTP ${res.status}`);
    return res.json();
  });
  return doFetch(url);
}

/**
 * Resolve queued subjects: for each, search GitHub for strong candidates and
 * insert as pending demand edges. Bounded (≤ 5 subjects, ≤ 2 queries each).
 */
export async function processDemandQueue(db, { limit = 5, fetcher = null } = {}) {
  let subjects;
  try {
    subjects = await dequeueSubjects(db, limit);
  } catch (e) {
    return { error: e.message, processed: 0 };
  }
  const stats = { processed: 0, edges: 0, junked: 0 };
  for (const s of subjects) {
    if (stats.processed >= limit) break;
    stats.processed++;
    try {
      const q = `${s.subject} in:name,description,topics stars:>100 archived:false`;
      const data = await ghSearchWithBudget(q, fetcher);
      let inserted = 0;
      for (const item of (data.items || []).slice(0, 6)) {
        const name = item.name || item.full_name || '';
        if (normalizeKey(name) === s.key) continue; // the subject itself
        const gate = junkGate({ name, stars: item.stargazers_count || 0 }, { source: 'demand' });
        if (gate.junk) { stats.junked++; continue; }
        const edge = {
          subject: s.subject,
          candidate_name: name,
          candidate_full_name: item.full_name,
          candidate_url: '',
          relation: 'alternative',
          source: 'demand',
          evidence_url: item.html_url,
          evidence_title: item.description ? item.description.slice(0, 160) : null,
          status: item.stargazers_count > 500 ? 'pending' : 'pending',
          confidence: gate.confidence,
          candidate_stars: item.stargazers_count || 0,
          candidate_archived: !!item.archived,
        };
        const r = await upsertEdge(db, edge, { verify: false });
        if (r?.edge?.status === 'pending') inserted++;
      }
      stats.edges += inserted;
      await finishSubject(db, s.key, { q, edges: inserted, via: 'demand_search' });
    } catch (e) {
      if (e.code === 'RATE_LIMITED') {
        // Put back for next cycle; budget floor protects against hammering.
        await finishSubject(db, s.key, { error: 'rate_limited' }, 'open');
        break;
      }
      await finishSubject(db, s.key, { error: e.message.slice(0, 200) }, 'junk');
    }
  }
  return stats;
}

// ── Orchestration ───────────────────────────────────────────────────────

/** Full refresh used by the autonomous loop (bounded, resilient). */
export async function refreshAltGraph(db, { awesome = true, seed = true, backfill = true, demand = true, fetcher = null } = {}) {
  const summary = {};
  if (seed) summary.seed = await ingestSeed(db);
  if (backfill) summary.backfill = await ingestCatalogBackfill(db);
  if (awesome) summary.awesome = await ingestAwesomeAltList(db, { fetcher });
  if (demand) summary.demand = await processDemandQueue(db, { limit: 5, fetcher });
  return summary;
}

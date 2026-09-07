/**
 * altgraph.js — Alternatives Knowledge Graph public API.
 *
 *   POST /api/altgraph/query    { subject } → verified edges for a subject
 *   POST /api/altgraph/suggest  { subject, candidate_name, candidate_full_name?,
 *                                 candidate_url?, relation? } → pending edge
 *   POST /api/altgraph/vote     { id, dir: 1|-1 } → community vote
 *   GET  /api/altgraph/status   → counts by source/status (graph growth)
 *
 * Everything runs on the shared /api rate limiter + CSRF protection already
 * mounted in server/index.js; suggest additionally gets a per-IP burst cap so
 * a single IP cannot flood the pending queue on the free tier.
 */

import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { serverCache } from '../services/cache.js';
import { getCatalogRepositories } from '../services/catalogEngine.js';
import {
  ensureAltGraphTables, edgesForSubject, graphForRepo, normalizeKey, upsertEdge,
  voteEdge, edgeCounts, queueStatus,
} from '../services/altGraph.js';
import { searchLongTail } from '../services/longTailRepo.js';

const router = Router();

// Per-IP / per-user caps — free-tier anti-flood, superseded by the global
// limiter for everything else. Logged-in voters key on their user id with a
// higher cap (more votes per human, still bounded); anonymous visitors keep
// the tight IP caps so a flooded address cannot manufacture the quorum that
// promotes an edge to 'verified'.
const suggestBuckets = new Map();
const voteBuckets = new Map();
function perIpAllow(map, key, max, windowMs) {
  const now = Date.now();
  const bucket = map.get(key) || { count: 0, windowStart: now };
  if (now - bucket.windowStart > windowMs) {
    bucket.count = 0;
    bucket.windowStart = now;
  }
  if (bucket.count >= max) return false;
  bucket.count++;
  map.set(key, bucket);
  return true;
}
const allowSuggest = (key) => perIpAllow(suggestBuckets, key, 5, 3600 * 1000);
const allowSuggestUser = (key) => perIpAllow(suggestBuckets, key, 25, 3600 * 1000);
const allowVote = (key) => perIpAllow(voteBuckets, key, 50, 3600 * 1000);
const allowVoteUser = (key) => perIpAllow(voteBuckets, key, 300, 3600 * 1000);

const suggestSchema = z.object({
  subject: z.string().trim().min(2, 'subject must be ≥ 2 characters').max(80),
  candidate_name: z.string().trim().min(2).max(70),
  candidate_full_name: z.string().trim().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, 'must look like owner/repo').optional().or(z.literal('')),
  candidate_url: z.string().trim().url().max(300).optional().or(z.literal('')),
  relation: z.enum(['alternative', 'successor', 'migrate_to']).optional(),
});

const voteSchema = z.object({
  id: z.string().min(1).max(100),
  dir: z.union([z.literal(1), z.literal(-1)]),
});

/**
 * Annotate edges with the requesting user's own vote direction (my_vote from
 * voter_log, last click wins) and the suggester's display name. Suggestion
 * attribution: an account name when the suggestor was signed in, otherwise
 * 'community'. Only the caller's own voter_log entries are read — other
 * voters' ids are never exposed.
 */
async function annotateEdges(edges, req) {
  if (!edges || edges.length === 0) return edges;
  const userId = req.user?.id || null;
  const logPrefix = userId ? `u:${userId}:` : `ip:${req.ip || 'anon'}:`;

  const suggesterIds = [...new Set(edges.map(e => e.suggested_by).filter(Boolean))];
  const nameMap = new Map();
  if (suggesterIds.length > 0) {
    try {
      const { rows } = await db.query('SELECT id, name FROM "User" WHERE id = ANY($1)', [suggesterIds]);
      for (const r of rows) nameMap.set(r.id, r.name);
    } catch (e) { /* best-effort name lookup */ }
  }

  return edges.map(e => {
    const log = Array.isArray(e.voter_log) ? e.voter_log : [];
    let myVote = 0;
    for (let i = log.length - 1; i >= 0; i--) {
      if (log[i].startsWith(logPrefix)) {
        myVote = log[i].endsWith(':1') ? 1 : -1;
        break;
      }
    }
    const by = e.suggested_by ? (nameMap.get(e.suggested_by) || null) : null;
    return { ...e, my_vote: myVote, suggested_by_name: by };
  });
}

async function enrichCandidates(edges) {
  if (!edges || edges.length === 0) return edges;
  const fullNames = edges.map(e => e.candidate_full_name).filter(Boolean);
  const repoIndex = new Map();
  if (fullNames.length > 0) {
    // 1) RAM catalog first (zero Neon cost)
    try {
      const ram = getCatalogRepositories() || [];
      for (const r of ram) {
        if (r.full_name) repoIndex.set(r.full_name.toLowerCase(), r);
      }
    } catch (e) { /* RAM lookup is best-effort */ }
    const missing = fullNames.filter(n => !repoIndex.has(n.toLowerCase()));
    if (missing.length > 0) {
      try {
        const { rows } = await db.query(
          `SELECT full_name, stars, forks, language, description, topics
             FROM "LongTailRepo" WHERE full_name = ANY($1)`,
          [missing]
        );
        for (const r of rows) repoIndex.set(r.full_name.toLowerCase(), r);
      } catch (e) { /* Neon miss tolerated */ }
      try {
        const { rows } = await db.query(
          `SELECT full_name, stars, forks, language, description, topics
             FROM "Repository" WHERE full_name = ANY($1)`,
          [missing]
        );
        for (const r of rows) repoIndex.set(r.full_name.toLowerCase(), r);
      } catch (e) { /* Neon miss tolerated */ }
    }
  }
  return edges.map(e => {
    const repo = e.candidate_full_name ? repoIndex.get(e.candidate_full_name.toLowerCase()) : null;
    return {
      ...e,
      stars: repo ? Number(repo.stars) || null : null,
      forks: repo ? Number(repo.forks) || null : null,
      language: repo?.language || null,
      description: repo?.description || null,
      repo_topics: repo?.topics || null,
    };
  });
}

router.post('/query', async (req, res) => {
  try {
    const subject = String(req.body?.subject || req.body?.q || '').trim().slice(0, 100);
    if (!subject) {
      return res.status(400).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'subject is required' } });
    }
    await ensureAltGraphTables(db);
    const key = normalizeKey(subject);
    const cacheKey = `altg:${key}`;
    const cached = serverCache.get(cacheKey);
    if (cached) return res.json(cached);

    const edges = await edgesForSubject(db, key, { limit: 12 });
    const enriched = await enrichCandidates(await annotateEdges(edges, req));
    const result = { subject, subject_key: key, results: enriched, total: enriched.length, graph: true };
    serverCache.set(cacheKey, result, 5 * 60 * 1000);
    return res.json(result);
  } catch (error) {
    console.error('[ALTGRAPH] query failed:', error.message);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

router.post('/suggest', async (req, res) => {
  const ip = req.ip || req.socket?.remoteAddress || 'anon';
  const capKey = req.user?.id ? `u:${req.user.id}` : ip;
  const allowed = req.user?.id ? allowSuggestUser(capKey) : allowSuggest(capKey);
  if (!allowed) {
    return res.status(429).json({ ok: false, error: { code: 'RATE_LIMITED', message: 'Too many suggestions from this address — try again later.' } });
  }
  const parsed = suggestSchema.safeParse(req.body || {});
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => i.message).join('; ');
    return res.status(400).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: msg, details: parsed.error.issues } });
  }
  try {
    await ensureAltGraphTables(db);
    const d = parsed.data;
    const edge = await upsertEdge(db, {
      subject: d.subject,
      candidate_name: d.candidate_name,
      candidate_full_name: d.candidate_full_name || '',
      candidate_url: d.candidate_url || '',
      relation: d.relation || 'alternative',
      source: 'community',
      status: 'pending',
      confidence: 0.4,
      suggested_by: req.user?.id || null,
    });
    if (!edge?.edge) {
      return res.status(409).json({ ok: false, error: { code: 'CONFLICT', message: 'Could not store suggestion.' } });
    }
    // Warm any caller cache for this subject so a fresh suggestion shows fast.
    serverCache.invalidate('altg:');
    return res.status(201).json({ ok: true, edge: edge.edge, status: edge.edge.status });
  } catch (error) {
    console.error('[ALTGRAPH] suggest failed:', error.message);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Graph context for a repository detail page (both directions).
router.post('/for-repo', async (req, res) => {
  const fullName = String(req.body?.full_name || req.body?.fullName || '').trim().slice(0, 120);
  const name = String(req.body?.name || '').trim().slice(0, 80);
  if (!fullName && !name) {
    return res.status(400).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'full_name is required' } });
  }
  try {
    await ensureAltGraphTables(db);
    const cacheKey = `altg:repo:${normalizeKey(fullName || name)}`;
    const cached = serverCache.get(cacheKey);
    if (cached) return res.json(cached);
    const graph = await graphForRepo(db, fullName, name);
    const [incoming, incomingPending, outgoing, outgoingPending] = await Promise.all([
      annotateEdges(graph.incoming, req),
      annotateEdges(graph.incomingPending, req),
      annotateEdges(graph.outgoing, req),
      annotateEdges(graph.outgoingPending, req),
    ]);
    const payload = {
      ok: true,
      incoming, incomingPending, outgoing, outgoingPending,
    };
    serverCache.set(cacheKey, payload, 5 * 60 * 1000);
    return res.json(payload);
  } catch (error) {
    console.error('[ALTGRAPH] for-repo failed:', error.message);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

router.post('/vote', async (req, res) => {
  const parsed = voteSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'id and dir (1|-1) required' } });
  }
  const ip = req.ip || req.socket?.remoteAddress || 'anon';
  const capKey = req.user?.id ? `u:${req.user.id}` : ip;
  const allowed = req.user?.id ? allowVoteUser(capKey) : allowVote(capKey);
  if (!allowed) {
    return res.status(429).json({ ok: false, error: { code: 'RATE_LIMITED', message: 'Too many votes from this address — try again later.' } });
  }
  try {
    await ensureAltGraphTables(db);
    // A logged-in voter is recorded by user id only (one human = one distinct
    // voter); anonymous voters are recorded by IP. Never both, so the quorum
    // count stays honest.
    const edge = await voteEdge(db, parsed.data.id, parsed.data.dir, req.user?.id ? null : ip, req.user?.id || null);
    if (!edge) return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Unknown edge' } });
    const [annotated] = await annotateEdges([edge], req);
    if (annotated) annotated.my_vote = parsed.data.dir; // the click we just recorded
    serverCache.invalidate('altg:');
    return res.json({ ok: true, edge: annotated || edge, promoted: edge.status === 'verified' });
  } catch (error) {
    console.error('[ALTGRAPH] vote failed:', error.message);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

router.get('/status', async (req, res) => {
  try {
    await ensureAltGraphTables(db);
    const [edges, queue] = await Promise.all([edgeCounts(db), queueStatus(db)]);
    return res.json({ ok: true, edges, queue });
  } catch (error) {
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Convenience: exact long-tail repo lookup (used by future deep-search UI)
router.post('/repo', async (req, res) => {
  try {
    const search = String(req.body?.q || req.body?.full_name || '').trim();
    if (search.length < 2) return res.json({ results: [], total: 0 });
    const data = await searchLongTail(db, { search, page: 1, perPage: 5 });
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

export default router;

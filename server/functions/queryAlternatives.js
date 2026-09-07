import { db } from '../db/index.js';
import { serverCache } from '../services/cache.js';
import { queryAlternativesCatalog, getCatalogRepositories } from '../services/catalogEngine.js';
import { ensureAltGraphTables, edgesForSubject, normalizeKey, captureDemand } from '../services/altGraph.js';
import { isTransferCritical } from '../services/transferGuard.js';

// Guard so the first graph-touching search does not pay DDL cost twice and a
// table-less serverless warm start never errors the whole handler.
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

/** Turn verified graph edges into the UI's alternative-card shape. */
async function graphEdgesAsAlternatives(searchTerm) {
  try {
    if (!(await ensureGraphTables())) return [];
    const key = normalizeKey(searchTerm);
    if (!key || key.length < 2) return [];
    const edges = await edgesForSubject(db, key, { limit: 8 });
    if (edges.length === 0) return [];

    // Enrich stars/language from RAM first (zero Neon cost), then a single
    // batched Neon lookup for whatever RAM misses. In critical transfer
    // mode the Neon lookup is skipped: RAM-only enrichment (zero transfer).
    const ram = new Map((getCatalogRepositories() || []).map(r => [(r.full_name || '').toLowerCase(), r]));
    const missing = isTransferCritical()
      ? []
      : edges.map(e => e.candidate_full_name).filter(Boolean)
          .filter(n => !ram.has(n.toLowerCase()));
    const neonRows = new Map();
    if (missing.length > 0) {
      try {
        const { rows } = await db.query(
          `SELECT full_name, stars, forks, language FROM "Repository" WHERE full_name = ANY($1)
           UNION ALL
           SELECT full_name, stars, forks, language FROM "LongTailRepo" WHERE full_name = ANY($1)`,
          [missing]
        );
        for (const r of rows) neonRows.set(r.full_name.toLowerCase(), r);
      } catch (e) { /* tolerant: RAM-only enrichment */ }
    }

    return edges.map((e, i) => {
      const repo = e.candidate_full_name
        ? (ram.get(e.candidate_full_name.toLowerCase()) || neonRows.get(e.candidate_full_name.toLowerCase()))
        : null;
      const url = e.candidate_url || (e.candidate_full_name ? `https://github.com/${e.candidate_full_name}` : '');
      return {
        id: `graph-${e.id}`,
        paid_tool_name: e.subject,
        free_tool_name: e.candidate_name,
        free_tool_repo: e.candidate_full_name || url || '',
        free_tool_url: url,
        category: 'Community Verified',
        subcategory: 'Community',
        description: e.evidence_title || `Open alternative to ${e.subject}`,
        html_url: url,
        stars: repo ? Number(repo.stars) : null,
        forks: repo ? Number(repo.forks) : null,
        language: repo?.language || null,
        openlysts_score: Math.min(96, Math.max(60, Math.round(40 + (e.votes_up || 0) * 4 + e.confidence * 40))),
        feature_parity_score: null,
        migration_difficulty: 'Medium',
        votes_up: e.votes_up,
        votes_down: e.votes_down,
        confidence: e.confidence,
        source: e.source,
        evidence_url: e.evidence_url,
        graph_edge: true,
        graph_index: i,
      };
    });
  } catch (e) {
    return [];
  }
}

const PER_PAGE = 24;

export default async function queryAlternatives(req, res) {
  try {
    const body = req.body || {};
    const {
      q = '',
      search = '',
      categories = [],
      category = '',
      sort = 'score',
      page = 1,
    } = body;

    const searchTerm = (q || search || '').trim().toLowerCase();
    let catList = Array.isArray(categories) ? [...categories] : (categories ? [categories] : []);
    if (category && category !== 'All' && !catList.includes(category)) {
      catList.push(category);
    }

    // Primary: In-memory catalog engine (sub-millisecond, full dataset)
    const catalogData = queryAlternativesCatalog({
      category: category || (catList.length > 0 ? catList[0] : 'All'),
      search: searchTerm,
      sort: sort || 'score',
      page: page || 1,
      perPage: PER_PAGE
    });

    let payload = catalogData;

    // Curated hit count (the alternatives result shape exposes it as
    // stats.filtered_tools, not a top-level total).
    const curatedHits = Number(catalogData.stats?.filtered_tools)
      ?? (Array.isArray(catalogData.alternatives) ? catalogData.alternatives.length : 0);

    // Graph merge: when the curated catalog barely covers the query, fold in
    // verified knowledge-graph edges (seed/awesome/catalog/community/demand)
    // so community-sourced swaps surface — evidence + votes included.
    if (searchTerm && curatedHits < 3) {
      const graphEntries = await graphEdgesAsAlternatives(searchTerm);
      if (graphEntries.length > 0) {
        payload = {
          ...catalogData,
          results: [...graphEntries, ...catalogData.results],
          alternatives: [...graphEntries, ...catalogData.results],
          stats: { ...catalogData.stats, filtered_tools: curatedHits + graphEntries.length },
          graph_total: graphEntries.length,
          graph_merged: true,
        };
      }
      // Zero-hit subject searches feed the auto-queue (demand discovery).
      if (curatedHits === 0 && searchTerm.trim().length >= 3) {
        captureDemand(db, searchTerm).catch(() => {});
      }
    }

    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      return res.json(payload);
    }
    return payload;
  } catch (error) {
    console.error('[queryAlternatives] Unexpected error:', error.message);
    if (res) {
      return res.status(500).json({ error: true, message: error.message });
    }
    throw error;
  }
}

export function invalidateAlternativesCache() {
  serverCache.invalidate('alts_');
  serverCache.invalidate('global_platform_stats');
}

export async function prewarmAlternativesCache() {
  // Prewarm logic using catalog engine
  try {
    queryAlternativesCatalog({ search: '', page: 1, perPage: 1 });
    // Representative token searches: JIT-compile the scoring hot path so the
    // first real alternatives search after boot answers in ms, not seconds.
    for (const q of ['zoom', 'database', 'chat', 'analytics']) {
      queryAlternativesCatalog({ search: q, page: 1, perPage: 24 });
    }
  } catch (e) {
    console.warn('[CACHE] Prewarm alternatives cache error:', e.message);
  }
}

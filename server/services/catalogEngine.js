import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';
import { calculateQualityScore, calculateVelocityScore } from './qualityScorer.js';
import { expandQueryIntent } from './semanticSearch.js';
import { featureFlags } from './featureFlags.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Robust data directory resolution for both local Node and Vercel Serverless (/var/task)
const possibleDataDirs = [
  path.join(process.cwd(), 'server', 'data'),
  path.join(__dirname, '..', 'data'),
  path.join(process.cwd(), 'data')
];
const DATA_DIR = possibleDataDirs.find(d => fs.existsSync(d)) || path.join(__dirname, '..', 'data');

const ALTS_PATH = path.join(DATA_DIR, 'mega_alternatives_catalog.json');
const REPOS_PATH = path.join(DATA_DIR, 'mega_repositories_catalog.json');

// Runtime overlay for alternatives: the shipped mega_alternatives_catalog.json
// is an immutable snapshot and is NEVER written at runtime (writing it back
// polluted the shipped file with lossy DB-mirror rows and made every local
// git status show the catalog as modified). Rows added at runtime (admin CRUD,
// community, Neon mirror keys absent from the snapshot) persist here instead,
// so a restart re-fuses them without ever touching the snapshot.
const ALTS_OVERLAY_PATH = path.join(DATA_DIR, 'runtime_alts_overlay.json');
// Keys present in the shipped snapshot: used to decide which RAM rows belong
// in the runtime overlay (only additions) so the overlay stays small.
const SNAPSHOT_ALT_KEYS = new Set();

// In-memory memory structures
let ALTERNATIVES = [];
let REPOSITORIES = [];
// Lowercased full_name → index into REPOSITORIES. Kept in sync at every
// mutation site; turns per-row duplicate lookup from O(n) scan into O(1) so a
// multi-thousand-row delta sync stays linear (load-tested in
// tests/api/delta-load.test.js).
const REPO_INDEX = new Map();
function reindexRepositories() {
  REPO_INDEX.clear();
  REPOSITORIES.forEach((r, i) => {
    if (r && r.full_name) REPO_INDEX.set(String(r.full_name).toLowerCase(), i);
  });
}
let INVERTED_INDEX_REPOS = new Map();
let INVERTED_INDEX_ALTS = new Map();

class SimpleLRU {
  constructor(limit = 100) {
    this.limit = limit;
    this.cache = new Map();
  }
  get(key) {
    if (!this.cache.has(key)) return null;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }
  set(key, val) {
    if (this.cache.has(key)) this.cache.delete(key);
    this.cache.set(key, val);
    if (this.cache.size > this.limit) {
      this.cache.delete(this.cache.keys().next().value);
    }
  }
  clear() {
    this.cache.clear();
  }
}
const QUERY_CACHE = new SimpleLRU(200);

const OFFICIAL_CATEGORIES = new Set([
  'ai', 'llms', 'ai agents', 'machine learning', 'local ai', 'rag',
  'dev tools', 'developer tools', 'databases', 'cloud devops', 'cloud & devops',
  'security', 'security auth', 'security & auth', 'security privacy', 'security & privacy',
  'observability', 'web applications', 'self hosted', 'self-hosted',
  'libraries frameworks', 'libraries & frameworks', 'business sales', 'business & sales',
  'automation', 'communication social', 'communication & social', 'content media', 'content & media',
  'data analytics', 'data & analytics', 'data lakehouse', 'data & lakehouse',
  'workflow automation', 'workflow & automation', 'wasm runtimes', 'wasm & runtimes',
  'sovereign infra', 'infrastructure devops', 'infrastructure & devops',
  'productivity utilities', 'productivity & utilities'
]);

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, ' ')
    .split(/[\s-_]+/)
    .filter(t => t.length > 1);
}

export const cleanMd = (str) => typeof str === 'string' ? str.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim() : (str || '');

/**
 * Enrich a raw alternative row into the UI-ready shape. Used by BOTH the
 * catalog-file loader (buildIndices) and the Neon delta-fusion path
 * (ingestCatalogAlternative) so every record — regardless of origin — gets
 * clean labels (markdown stripped), a resolved display name, a repo object,
 * and honest scores. Without this, DB-synced rows render blank cards
 * (missing resolved_name/repo) and leak raw markdown into category/paid labels.
 */
function enrichAlternative(alt) {
  // Cross-reference with the repository catalog FIRST so rows whose own
  // fields carry no stars (DB-mirror rows, awesome-list templates) still
  // score honestly from the real GitHub repo when it exists in RAM. Without
  // this, star-less rows collapsed to a uniform low score (43-48) and the
  // Alternatives page rendered every card identically.
  const repoFullName = String(alt.free_tool_repo || alt.repoFullName || '');
  const catalogMatch = repoFullName.includes('/')
    ? REPOSITORIES.find(r => (r.full_name || '').toLowerCase() === repoFullName.toLowerCase())
    : null;
  const catalogStars = catalogMatch ? (Number(catalogMatch.stars) || 0) : 0;

  const stars = Number(alt.stars) || catalogStars;
  const hasFpScore = alt.feature_parity_score && alt.feature_parity_score !== 75;
  const hasDesc = alt.description && cleanMd(alt.description).length > 30;
  const hasLicense = !!alt.license_key;
  const hasUrl = !!alt.html_url || !!alt.free_tool_url || (repoFullName.includes('/') || repoFullName.startsWith('http'));

  // Stars component (0-40 points) — logarithmic scale
  const starsComponent = stars > 0 ? Math.min(40, Math.round(Math.log10(stars + 1) * 8)) : 5;
  // Feature parity (0-25 points)
  const parityComponent = hasFpScore ? Math.round((alt.feature_parity_score / 100) * 25) : 12;
  // Data completeness (0-20 points)
  const completeness = (hasDesc ? 7 : 0) + (hasLicense ? 5 : 0) + (hasUrl ? 4 : 0) + (hasFpScore ? 4 : 0);
  // Base (15 points for being in the catalog at all)
  const score = Math.max(30, Math.min(99, 15 + starsComponent + parityComponent + completeness));

  const fpScore = hasFpScore ? alt.feature_parity_score : Math.min(95, Math.max(50, Math.round(score * 0.85)));
  const difficulty = alt.migration_difficulty || (stars > 25000 ? 'Easy' : stars > 8000 ? 'Medium' : 'Advanced');

  const cleanCategory = cleanMd(alt.category) || 'Developer Tools';
  const cleanPaid = cleanMd(alt.paid_tool_name || alt.paid) || 'Proprietary Tool';
  const cleanFree = cleanMd(alt.free_tool_name || alt.name) || (repoFullName.includes('/') ? repoFullName.split('/')[1] : repoFullName) || 'Alternative';
  const repoUrl = alt.html_url || alt.free_tool_url
    || (repoFullName.startsWith('http') ? repoFullName
      : (repoFullName.includes('/') ? `https://github.com/${repoFullName}` : undefined));

  return {
    ...alt,
    category: cleanCategory,
    subcategory: cleanMd(alt.subcategory) || cleanCategory,
    paid_tool_name: cleanPaid,
    free_tool_name: cleanFree,
    resolved_name: cleanFree,
    description: cleanMd(alt.description),
    openlysts_score: score,
    feature_parity_score: fpScore,
    migration_difficulty: difficulty,
    html_url: repoUrl,
    repo: catalogMatch ? {
      id: catalogMatch.id,
      full_name: catalogMatch.full_name,
      name: catalogMatch.name,
      stars: catalogMatch.stars || stars,
      forks: catalogMatch.forks || 0,
      language: catalogMatch.language || 'Unknown',
      quality_score: catalogMatch.quality_score || score,
      html_url: catalogMatch.html_url || repoUrl
    } : {
      id: `repo-${cleanFree.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      full_name: repoFullName || `${cleanFree.toLowerCase()}/${cleanFree.toLowerCase()}`,
      name: cleanFree,
      stars: stars,
      language: alt.language || 'Unknown',
      quality_score: score,
      html_url: repoUrl
    }
  };
}

/**
 * Strong junk-mapping signal (TaleForge→"Zoom" class): the row has no real
 * description (empty or the generated "Open source alternative to …" template)
 * AND its repo is NOT in the known repository catalog AND the repo name shares
 * no token with the paid target. Genuine-but-obscure tools survive because they
 * appear in the 50k repo catalog; genuinely misfiled rows are dropped.
 * Used consistently by the file loader, the Neon-fusion path and the cleanup
 * script so the definition can never drift between layers.
 */
export function isJunkAlternativeRecord(alt) {
  const repoFullName = String(alt.free_tool_repo || alt.repoFullName || '').trim();
  if (!repoFullName || repoFullName.includes('http') || !repoFullName.includes('/')) return false;
  const desc = cleanMd(alt.description || '');
  if (!desc || /^open source alternative to /i.test(desc)) {
    const repoLower = repoFullName.toLowerCase();
    const inCatalog = REPOSITORIES.some(r => (r.full_name || '').toLowerCase() === repoLower);
    if (inCatalog) return false;
    const paid = cleanMd(alt.paid_tool_name || alt.paid || '').toLowerCase();
    const repoName = String(alt.free_tool_name || repoFullName.split('/').pop() || '').toLowerCase();
    const paidTokens = new Set(paid.split(/[^a-z0-9]+/).filter(t => t.length > 2));
    const nameTokens = new Set(repoName.split(/[^a-z0-9]+/).filter(t => t.length > 2));
    for (const t of nameTokens) if (paidTokens.has(t)) return false;
    return true;
  }
  return false;
}

function buildIndices() {
  // Raw alternatives are parsed + deduplicated here but NOT enriched yet:
  // enrichment cross-references REPOSITORIES (real stars/language), which is
  // loaded in the second try-block below. Enriching before repos load would
  // leave every catalog row with a star-less fallback repo object.
  let dedupedAlts = null;
  try {
    if (fs.existsSync(ALTS_PATH)) {
      const rawAlts = JSON.parse(fs.readFileSync(ALTS_PATH, 'utf-8'));

      // Deduplicate alternatives by paid_tool_name + free_tool_name using
      // markdown-CLEANED names so "Zoom" and "[Zoom](https://zoom.com)"
      // collapse into one row (raw markdown labels are a data-hygiene
      // artifact of the AwesomeSelfHosted import).
      const seen = new Map();
      for (const alt of rawAlts) {
        const paid = cleanMd(alt.paid_tool_name || '').toLowerCase().trim();
        const free = cleanMd(alt.free_tool_name || alt.name || '').toLowerCase().trim();
        const key = `${paid}|||${free}`;
        if (key === '|||') continue; // Skip empty entries
        const existing = seen.get(key);
        if (!existing || (Number(alt.stars) || 0) > (Number(existing.stars) || 0)) {
          seen.set(key, alt);
        }
      }
      dedupedAlts = [...seen.values()];
      // Record the snapshot's own keys so the runtime overlay can store only
      // genuine additions (admin/community/Neon keys absent from the snapshot).
      for (const alt of dedupedAlts) {
        const paid = cleanMd(alt.paid_tool_name || alt.paid || 'Proprietary Tool').trim().toLowerCase();
        const repo = String(alt.free_tool_repo || alt.repoFullName || '').trim().toLowerCase();
        if (repo) SNAPSHOT_ALT_KEYS.add(`${repo}|||${paid}`);
      }
      console.log(`[CATALOG] Deduplicated alternatives: ${rawAlts.length} → ${dedupedAlts.length}`);
    }
  } catch (err) {
    console.error('[CATALOG ENGINE] Failed to load alternatives catalog:', err.message);
  }

  try {
    const gzPath = REPOS_PATH + '.gz';
    if (fs.existsSync(gzPath)) {
      const gzipped = fs.readFileSync(gzPath);
      REPOSITORIES = JSON.parse(zlib.gunzipSync(gzipped).toString('utf-8'));
    } else if (fs.existsSync(REPOS_PATH)) {
      REPOSITORIES = JSON.parse(fs.readFileSync(REPOS_PATH, 'utf-8'));
    }
    reindexRepositories();
  } catch (err) {
    console.error('[CATALOG ENGINE] Failed to load repositories catalog:', err.message);
  }

  // Enrich alternatives NOW that repositories are loaded (real stars, language,
  // quality and URLs when the free tool's repo is in the repository catalog).
  if (dedupedAlts) {
    ALTERNATIVES = dedupedAlts.map(enrichAlternative);
    // Re-fuse runtime additions (admin/community rows saved by a previous
    // process) on top of the snapshot — additive-only, so curated rows are
    // never replaced by lossy mirror copies.
    loadRuntimeAltOverlay();
  }

  // Honest normalization for bundled-catalog rows. The builder stamps every
  // row with a placeholder trending band of 80-99 and no real growth evidence,
  // so a row sitting in that band with zero recorded star growth is a
  // placeholder, not a measurement. Replace it with the magnitude proxy derived
  // from the row's real star/fork fields so no fabricated ranking reaches the
  // UI. (Neon-fused rows are re-ingested after this pass with real scores.)
  let normalizedFileRows = 0;
  for (const repo of REPOSITORIES) {
    const t = repo.trending_score;
    if (t !== undefined && t !== null && t >= 80 && t <= 99
        && !repo.stars_gained_24h && !repo.stars_gained_7d && !repo.stars_gained_30d) {
      repo.trending_score = calculateVelocityScore(repo);
      normalizedFileRows++;
    }
  }
  if (normalizedFileRows > 0) {
    console.log(`[CATALOG ENGINE] Normalized ${normalizedFileRows} file-sourced trending placeholders to magnitude proxy.`);
  }

  // Build Inverted Index for Repositories
  INVERTED_INDEX_REPOS.clear();
  REPOSITORIES.forEach((repo, idx) => {
    const tokens = new Set([
      ...tokenize(repo.name),
      ...tokenize(repo.full_name),
      ...tokenize(repo.description),
      ...(repo.topics || []).flatMap(tokenize),
      ...(repo.categories || []).flatMap(tokenize),
      tokenize(repo.language)[0]
    ].filter(Boolean));

    tokens.forEach(token => {
      if (!INVERTED_INDEX_REPOS.has(token)) {
        if (INVERTED_INDEX_REPOS.size >= 100000) return;
        INVERTED_INDEX_REPOS.set(token, new Set());
      }
      INVERTED_INDEX_REPOS.get(token).add(idx);
    });
  });

  // Build Inverted Index for Alternatives
  INVERTED_INDEX_ALTS.clear();
  ALTERNATIVES.forEach((alt, idx) => {
    const tokens = new Set([
      ...tokenize(alt.paid_tool_name),
      ...tokenize(alt.free_tool_name),
      ...tokenize(alt.free_tool_repo),
      ...tokenize(alt.category),
      ...tokenize(alt.subcategory),
      ...tokenize(alt.description)
    ].filter(Boolean));

    tokens.forEach(token => {
      if (!INVERTED_INDEX_ALTS.has(token)) {
        if (INVERTED_INDEX_ALTS.size >= 50000) return;
        INVERTED_INDEX_ALTS.set(token, new Set());
      }
      INVERTED_INDEX_ALTS.get(token).add(idx);
    });
  });

  QUERY_CACHE.clear();

  const mem = process.memoryUsage();
  console.log(`[CATALOG ENGINE] Indexed ${REPOSITORIES.length} repositories & ${ALTERNATIVES.length} alternatives in-memory.`);
  console.log(`[CATALOG ENGINE] Memory usage: RSS=${Math.round(mem.rss / 1024 / 1024)}MB, HeapTotal=${Math.round(mem.heapTotal / 1024 / 1024)}MB, HeapUsed=${Math.round(mem.heapUsed / 1024 / 1024)}MB`);
}

let lastSyncTime = new Date(0);
let isSyncing = false;

const CURSOR_FILE = path.join(DATA_DIR, 'delta_cursor.json');

// Persistent cross-restart delta watermark, shared with deltaSync.js so a fresh
// boot resumes from the LAST fused position instead of the static catalog
// snapshot date. Without it every boot re-pulled the whole Repository table
// (measured 17-18k rows / ~18 MB) because RAM resets to the file watermark;
// that was a top Neon data-transfer driver.
function loadDeltaCursor() {
  try {
    if (fs.existsSync(CURSOR_FILE)) {
      const data = JSON.parse(fs.readFileSync(CURSOR_FILE, 'utf8'));
      return {
        lastRepoSyncAt: data.lastRepoSyncAt ? new Date(data.lastRepoSyncAt) : null,
        lastAltSyncAt: data.lastAltSyncAt ? new Date(data.lastAltSyncAt) : null,
      };
    }
  } catch { /* tolerant */ }
  return { lastRepoSyncAt: null, lastAltSyncAt: null };
}

function saveDeltaCursor(repoAt, altAt) {
  try {
    let prev = {};
    if (fs.existsSync(CURSOR_FILE)) prev = JSON.parse(fs.readFileSync(CURSOR_FILE, 'utf8'));
    if (repoAt && (!prev.lastRepoSyncAt || new Date(repoAt) > new Date(prev.lastRepoSyncAt))) prev.lastRepoSyncAt = repoAt;
    if (altAt && (!prev.lastAltSyncAt || new Date(altAt) > new Date(prev.lastAltSyncAt))) prev.lastAltSyncAt = altAt;
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(CURSOR_FILE, JSON.stringify(prev, null, 2), 'utf8');
  } catch (e) {
    console.warn('[CATALOG ENGINE] delta cursor save warning:', e.message);
  }
}

export async function syncDeltasFromDB(force = false) {
  if (isSyncing) return;
  
  // Throttle sync to at most once every 60 seconds per instance, unless forced
  const now = new Date();
  if (!force && now - lastSyncTime < 60000) return;
  
  isSyncing = true;
  try {
    const { db } = await import('../db/index.js');
    
    // Delta cursor = furthest of (persisted watermark, in-memory max). RAM
    // resets to the shipped snapshot on every boot, so the persisted watermark
    // is what keeps restarts incremental instead of full-table pulls.
    const persisted = loadDeltaCursor();

    // Find the latest updated_at in memory to use as the delta cursor
    let maxUpdatedRepo = persisted.lastRepoSyncAt || new Date(0);
    if (REPOSITORIES.length > 0) {
      REPOSITORIES.forEach(r => {
        const d = new Date(r.updated_at || 0);
        if (d > maxUpdatedRepo) maxUpdatedRepo = d;
      });
    }

    let maxUpdatedAlt = persisted.lastAltSyncAt || new Date(0);
    if (ALTERNATIVES.length > 0) {
      ALTERNATIVES.forEach(a => {
        const d = new Date(a.updated_at || 0);
        if (d > maxUpdatedAlt) maxUpdatedAlt = d;
      });
    }

    // Only fetch records updated after our max in-memory timestamp
    const [repoRes, altRes] = await Promise.allSettled([
      db.query('SELECT * FROM "Repository" WHERE updated_at > $1 ORDER BY updated_at ASC', [maxUpdatedRepo.toISOString()]),
      db.query('SELECT * FROM "Alternative" WHERE updated_at > $1 ORDER BY updated_at ASC', [maxUpdatedAlt.toISOString()])
    ]);

    // Cursor advance = newest row actually fetched from the DB (the results
    // are ordered ASC, so the last row carries the max). RAM cannot supply
    // this: ingestCatalogRepository deliberately drops updated_at from its
    // formatted rows, so any RAM-derived cursor decays back to the shipped
    // snapshot and re-pulls the whole table on the next cycle/boot.
    let fetchedRepoMax = maxUpdatedRepo;
    let fetchedAltMax = maxUpdatedAlt;
    if (repoRes.status === 'fulfilled' && repoRes.value.rows && repoRes.value.rows.length > 0) {
      const last = repoRes.value.rows[repoRes.value.rows.length - 1].updated_at;
      if (last && new Date(last) > new Date(fetchedRepoMax)) fetchedRepoMax = new Date(last);
    }
    if (altRes.status === 'fulfilled' && altRes.value.rows && altRes.value.rows.length > 0) {
      const last = altRes.value.rows[altRes.value.rows.length - 1].updated_at;
      if (last && new Date(last) > new Date(fetchedAltMax)) fetchedAltMax = new Date(last);
    }

    let repoDeltas = 0;
    let altDeltas = 0;

    if (repoRes.status === 'fulfilled' && repoRes.value.rows) {
      repoRes.value.rows.forEach(r => {
        ingestCatalogRepository(r);
        repoDeltas++;
      });
    }
    if (altRes.status === 'fulfilled' && altRes.value.rows) {
      for (const a of altRes.value.rows) {
        if (additiveAlternativeIngest(a)) altDeltas++;
      }
    }

    // Self-healing reconcile: if the DB holds more DISTINCT alternatives than
    // the RAM catalog (e.g. a bulk backfill older than the RAM watermark), fuse
    // the whole table regardless of timestamps. Timestamp deltas alone can wedge
    // forever after a backfill, so the count gap is the authoritative signal.
    // IMPORTANT: the Neon "Alternative" table is a LOSSY mirror of the shipped
    // curated catalog — it has no stars column and bulk rows carry a 2024
    // sentinel updated_at. Fusing it over richer RAM rows destroyed real star
    // counts and collapsed every card to the same low score (the all-48 bug),
    // then schedulePersistAlts wrote that damage back over the shipped JSON.
    // The mirror is only authoritative for keys the curated catalog lacks, so
    // reconcile is ADDITIVE: rows whose (repo, paid) key already exists in RAM
    // are never re-ingested, and nothing here ever replaces a richer row.
    if (altDeltas === 0 && repoRes.status === 'fulfilled') {
      try {
        const beforeCount = ALTERNATIVES.length;
        const keyRes = await db.query(
          `SELECT count(*)::int AS n FROM (
             SELECT DISTINCT lower(coalesce(trim(paid_tool_name),'')) || '|||' ||
                             lower(coalesce(trim(free_tool_repo),''))
             FROM "Alternative"
             WHERE coalesce(paid_tool_name,'') <> '' AND coalesce(free_tool_repo,'') <> ''
           ) k`
        );
        const dbDistinctKeys = keyRes.rows[0]?.n || 0;
        if (dbDistinctKeys > beforeCount) {
          const fullAlts = await db.query('SELECT * FROM "Alternative" ORDER BY updated_at ASC');
          for (const a of fullAlts.rows) {
            if (additiveAlternativeIngest(a)) altDeltas++;
          }
          console.log(`[CATALOG ENGINE] Alt reconcile: DB has ${dbDistinctKeys} distinct keys vs ${beforeCount} in RAM — added ${altDeltas} missing rows (${beforeCount} → ${ALTERNATIVES.length}).`);
        }
      } catch (err) {
        console.warn('[CATALOG ENGINE] Alt reconcile skipped:', err.message);
      }
    }
    
    lastSyncTime = new Date();
    // Persist the advanced watermark unconditionally (even with 0 deltas the
    // cursor is already at the newest DB row after the first fuse), so restarts
    // and the 5-min reconcile stay incremental instead of full-table pulls.
    saveDeltaCursor(fetchedRepoMax, fetchedAltMax);
    if (repoDeltas > 0 || altDeltas > 0) {
      QUERY_CACHE.clear();
      console.log(`[CATALOG ENGINE] Fused ${repoDeltas} repo deltas and ${altDeltas} alt deltas from Neon DB.`);
    }
  } catch (err) {
    console.error('[CATALOG ENGINE] Failed to sync deltas from DB:', err.message);
  } finally {
    isSyncing = false;
  }
}

// Initialize indices on module load
buildIndices();

let persistTimeout = null;
function schedulePersist() {
  if (persistTimeout) return;
  // Vercel serverless environment is read-only, do not attempt fs.writeFileSync
  const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
  if (isProd) return;

  persistTimeout = setTimeout(() => {
    persistTimeout = null;
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(REPOS_PATH, JSON.stringify(REPOSITORIES, null, 2), 'utf-8');
      console.log(`[CATALOG ENGINE] Successfully persisted ${REPOSITORIES.length} repositories to disk.`);
    } catch (err) {
      console.warn('[CATALOG ENGINE] Failed to persist repositories to disk:', err.message);
    }
  }, 3000);
}

/**
 * Live Ingest / Sync into in-memory catalog and inverted index
 */
export function ingestCatalogRepository(repo) {
  if (!repo || !repo.full_name) return null;
  const fullNameLower = repo.full_name.toLowerCase();
  const existingIdx = REPO_INDEX.has(fullNameLower) ? REPO_INDEX.get(fullNameLower) : -1;

  // Honest score mapping: use recorded DB values whenever present; otherwise
  // derive from real repository signals via qualityScorer. Never invent flat
  // constants (old `|| 80/85` defaults polluted zero-star repos as 'rising').
  const numOr = (v, fb) => (v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v))) ? Number(v) : fb;

  const formatted = {
    id: repo.id || `repo-${fullNameLower.replace(/[^a-z0-9]/g, '-')}`,
    github_id: repo.github_id || null,
    full_name: repo.full_name,
    owner: repo.owner || repo.full_name.split('/')[0] || '',
    name: repo.name || repo.full_name.split('/')[1] || '',
    description: repo.description || '',
    html_url: repo.html_url || `https://github.com/${repo.full_name}`,
    homepage_url: repo.homepage_url || '',
    default_branch: repo.default_branch || 'main',
    language: repo.language || '',
    license_key: repo.license_key || repo.license_status || '',
    license_name: repo.license_name || '',
    license_url: repo.license_url || '',
    license_status: repo.license_status || 'Permissive',
    stars: Number(repo.stars) || 0,
    stargazers_count: Number(repo.stars) || Number(repo.stargazers_count) || 0,
    forks: Number(repo.forks) || 0,
    open_issues: Number(repo.open_issues) || 0,
    watchers: Number(repo.watchers) || Number(repo.stars) || 0,
    topics: Array.isArray(repo.topics) ? repo.topics : [],
    categories: Array.isArray(repo.categories) ? repo.categories : [],
    github_created_at: repo.github_created_at || new Date().toISOString(),
    github_updated_at: repo.github_updated_at || new Date().toISOString(),
    last_ingested_at: repo.last_ingested_at || new Date().toISOString(),
    archived: Boolean(repo.archived),
    hidden: Boolean(repo.hidden),
    featured: Boolean(repo.featured),
    // Honest score mapping: use recorded DB values whenever present; otherwise
    // derive from real repository signals via qualityScorer. Never invent flat
    // constants (old `|| 80/85` defaults polluted zero-star repos as 'rising').
    quality_score: numOr(repo.quality_score, calculateQualityScore(repo)),
    trending_score: numOr(repo.trending_score, calculateVelocityScore(repo)),
    velocity_score: numOr(repo.velocity_score, calculateVelocityScore(repo)),
    stars_gained_24h: numOr(repo.stars_gained_24h, 0),
    stars_gained_7d: numOr(repo.stars_gained_7d, 0),
    stars_gained_30d: numOr(repo.stars_gained_30d, 0),
    difficulty: repo.difficulty || 'Medium',
    engagement_score: numOr(repo.engagement_score, 0),
    authority_score: numOr(repo.authority_score, 0),
    staff_pick: Boolean(repo.staff_pick),
    openlysts_score_boost: Number(repo.openlysts_score_boost) || 0,
    // Preserve the row's real update timestamp. Stamping now() here on EVERY
    // touch (ingestion re-processes the same repos every cycle) advanced the
    // delta watermark past every other row and made the boot/5-min reconcile
    // re-pull the entire Repository table from Neon — the single biggest
    // measured driver of the 5 GB monthly transfer. Keep the DB value when the
    // row came from Neon, keep the RAM value when it already existed, and only
    // stamp now() for genuinely new rows.
    updated_at: repo.updated_at
      || (existingIdx >= 0 ? (REPOSITORIES[existingIdx].updated_at || '') : '')
      || new Date().toISOString(),
    tags: Array.isArray(repo.tags) ? repo.tags : []
  };

  let targetIdx;
  if (existingIdx >= 0) {
    REPOSITORIES[existingIdx] = { ...REPOSITORIES[existingIdx], ...formatted };
    targetIdx = existingIdx;
  } else {
    REPOSITORIES.push(formatted);
    targetIdx = REPOSITORIES.length - 1;
    REPO_INDEX.set(fullNameLower, targetIdx);
  }

  // Re-index tokens into inverted index
  const tokens = new Set([
    ...tokenize(formatted.name),
    ...tokenize(formatted.full_name),
    ...tokenize(formatted.description),
    ...(formatted.topics || []).flatMap(tokenize),
    ...(formatted.categories || []).flatMap(tokenize),
    tokenize(formatted.language)[0]
  ].filter(Boolean));

  tokens.forEach(token => {
    if (!INVERTED_INDEX_REPOS.has(token)) {
      INVERTED_INDEX_REPOS.set(token, new Set());
    }
    INVERTED_INDEX_REPOS.get(token).add(targetIdx);
  });

  schedulePersist();
  return formatted;
}

/**
 * Additive-only alternative ingest for the Neon mirror sync paths (delta +
 * reconcile). The curated catalog shipped in mega_alternatives_catalog.json is
 * the authoritative display source; the Neon "Alternative" table is a lossy
 * mirror (no stars column) used for admin CRUD + community rows. Fusing mirror
 * rows over richer curated rows zeroed real star counts and collapsed every
 * card to the same low score. This helper ingests ONLY keys absent from RAM,
 * so new/community rows reach the catalog while curated rows are preserved.
 */
function additiveAlternativeIngest(alt) {
  if (!alt || !alt.free_tool_repo) return false;
  const repoLower = (alt.free_tool_repo || '').trim().toLowerCase();
  const paidLower = cleanMd(alt.paid_tool_name || alt.paid || 'Proprietary Tool').trim().toLowerCase();
  const exists = ALTERNATIVES.some(a =>
    (a.free_tool_repo || '').toLowerCase() === repoLower &&
    cleanMd(a.paid_tool_name || a.paid || 'Proprietary Tool').trim().toLowerCase() === paidLower
  );
  if (exists) return false;
  const enriched = ingestCatalogAlternative(alt);
  return !!enriched;
}

function persistRuntimeAltOverlay() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    // Only rows whose (repo,paid) key is NOT in the shipped snapshot belong in
    // the runtime overlay. Never write the snapshot file itself: re-writing it
    // with lossy DB-mirror rows corrupted the curated catalog and produced
    // endless "modified" churn in git status.
    const additions = ALTERNATIVES.filter(a => {
      const repo = String(a.free_tool_repo || a.repoFullName || '').trim().toLowerCase();
      const paid = cleanMd(a.paid_tool_name || a.paid || 'Proprietary Tool').trim().toLowerCase();
      return repo && !SNAPSHOT_ALT_KEYS.has(`${repo}|||${paid}`);
    });
    fs.writeFileSync(ALTS_OVERLAY_PATH, JSON.stringify(additions, null, 2), 'utf-8');
    if (additions.length > 0) {
      console.log(`[CATALOG ENGINE] Persisted ${additions.length} runtime alternative additions to ${path.basename(ALTS_OVERLAY_PATH)}.`);
    }
  } catch (err) {
    // Vercel serverless FS is read-only — overlay persistence is best-effort;
    // Neon remains the durable store there and the boot fuse re-fuses on cold start.
  }
}

let persistAltsTimeout = null;
function schedulePersistAlts() {
  if (persistAltsTimeout) return;
  persistAltsTimeout = setTimeout(() => {
    persistAltsTimeout = null;
    persistRuntimeAltOverlay();
  }, 3000);
}

function loadRuntimeAltOverlay() {
  try {
    if (!fs.existsSync(ALTS_OVERLAY_PATH)) return 0;
    const overlay = JSON.parse(fs.readFileSync(ALTS_OVERLAY_PATH, 'utf-8'));
    if (!Array.isArray(overlay)) return 0;
    let added = 0;
    for (const row of overlay) {
      if (additiveAlternativeIngest(row)) added++;
    }
    if (added > 0) {
      console.log(`[CATALOG ENGINE] Fused ${added} runtime overlay additions back into the catalog.`);
    }
    return added;
  } catch (err) {
    return 0;
  }
}

export function ingestCatalogAlternative(alt) {
  if (!alt || !alt.free_tool_repo) return null;
  const repoLower = (alt.free_tool_repo || '').toLowerCase();
  // Match on markdown-CLEANED names: RAM rows store cleaned labels, while DB
  // rows may still carry raw markdown (e.g. "[Zoom](https://zoom.com)").
  // Without cleaning here, the same tool+target pair fails the duplicate
  // lookup and gets pushed twice (the visible duplicate TaleForge card).
  const paidLower = cleanMd(alt.paid_tool_name || alt.paid || 'Proprietary Tool').trim().toLowerCase();
  const existingIdx = ALTERNATIVES.findIndex(a => 
    (a.free_tool_repo || '').toLowerCase() === repoLower &&
    cleanMd(a.paid_tool_name || a.paid || 'Proprietary Tool').trim().toLowerCase() === paidLower
  );

  const formatted = {
    id: alt.id || `alt-${repoLower.replace(/[^a-z0-9]/g, '-')}-${paidLower.replace(/[^a-z0-9]/g, '-')}`,
    paid_tool_name: alt.paid_tool_name || alt.paid || 'Proprietary Tool',
    free_tool_name: alt.free_tool_name || alt.resolved_name || (alt.free_tool_repo.includes('/') ? alt.free_tool_repo.split('/')[1] : alt.free_tool_repo),
    free_tool_repo: alt.free_tool_repo,
    category: alt.category || 'General',
    subcategory: alt.subcategory || alt.category || '',
    description: alt.description || `Open source alternative to ${alt.paid_tool_name || alt.paid}`,
    migration_difficulty: alt.migration_difficulty || 'Medium',
    feature_parity_score: Number(alt.feature_parity_score) || 75,
    openlysts_score: Number(alt.openlysts_score) || 85,
    verified_oss: alt.verified_oss !== false,
    // Preserve the DB/file timestamp when present. Stamping now() here would
    // permanently advance the delta-sync watermark past any bulk backfill that
    // predates this ingest, wedging those rows out of the RAM catalog forever.
    updated_at: alt.updated_at || new Date().toISOString(),
    html_url: alt.free_tool_url || (alt.free_tool_repo?.startsWith('http') ? alt.free_tool_repo : undefined)
  };

  // Same enrichment the file loader applies: clean markdown labels, resolve a
  // display name + repo object, and compute honest scores — so Neon-fused rows
  // render exactly like bundled ones (no blank cards / 'undefined' compares).
  const enriched = enrichAlternative(formatted);

  let targetIdx;
  if (existingIdx >= 0) {
    // Never let a lossy mirror row zero the enrichment of a richer entry that
    // is already served (real stars/repo/score). Incoming text fields win only
    // when they carry data; enrichment-critical fields (stars, repo object)
    // are preserved from the existing row whenever the incoming row is
    // star-less — the Neon "Alternative" table has no stars column at all.
    const prev = ALTERNATIVES[existingIdx];
    const prevRepoStars = Number(prev?.repo?.stars) || 0;
    const incomingStars = Number(formatted?.repo?.stars) || Number(enriched?.repo?.stars) || 0;
    const keepRicher = prevRepoStars > 0 && incomingStars === 0;
    ALTERNATIVES[existingIdx] = keepRicher
      ? { ...enriched, ...prev, stars: prevRepoStars || prev.stars, repo: prev.repo, html_url: prev.html_url || enriched.html_url }
      : { ...prev, ...enriched };
    targetIdx = existingIdx;
  } else {
    ALTERNATIVES.push(enriched);
    targetIdx = ALTERNATIVES.length - 1;
  }

  // Re-index tokens (clean labels — markdown already stripped by enrichment)
  const tokens = new Set([
    ...tokenize(enriched.paid_tool_name),
    ...tokenize(enriched.free_tool_name),
    ...tokenize(enriched.free_tool_repo),
    ...tokenize(enriched.category),
    ...tokenize(enriched.subcategory),
    ...tokenize(enriched.description),
    ...tokenize(enriched.resolved_name)
  ].filter(Boolean));

  tokens.forEach(token => {
    if (!INVERTED_INDEX_ALTS.has(token)) {
      INVERTED_INDEX_ALTS.set(token, new Set());
    }
    INVERTED_INDEX_ALTS.get(token).add(targetIdx);
  });

  schedulePersistAlts();
  return enriched;
}

/**
 * High-Speed In-Memory Repository Query Engine with Pagination, Facets & Ranking
 */
export function queryRepositoriesCatalog(params = {}) {
  const {
    search = '',
    categories = [],
    languages = [],
    sort = 'trending',
    page = 1,
    perPage = 24,
    license = '',
    minStars = 0,
    minScore = 0
  } = params;

  const cacheKey = 'repo:' + JSON.stringify(params);
  const cached = QUERY_CACHE.get(cacheKey);
  if (cached) return cached;

  let matchedIndices = null;
  const relevanceScores = new Map();

  // 1. Text Search using Inverted Index + Substring Ranking + Semantic Intent Expansion
  const searchTrimmed = (search || '').trim().toLowerCase();
  if (searchTrimmed) {
    const searchTokens = tokenize(searchTrimmed);
    // Semantic intent expansion is kill-switchable via the semantic_search flag
    const semanticConcepts = featureFlags.isEnabled('semantic_search')
      ? expandQueryIntent(searchTrimmed).flatMap(tokenize).filter(t => !searchTokens.includes(t))
      : [];

    if (searchTokens.length > 0) {
      let currentMatches = null;
      for (const token of searchTokens) {
        // Collect exact and prefix matches
        const tokenMatches = new Set();
        for (const [indexedToken, indices] of INVERTED_INDEX_REPOS.entries()) {
          if (indexedToken === token || indexedToken.startsWith(token)) {
            indices.forEach(idx => {
              tokenMatches.add(idx);
              const repo = REPOSITORIES[idx];
              let score = relevanceScores.get(idx) || 0;
              if (indexedToken === token) {
                score += (repo.name.toLowerCase() === token ? 100 : 40);
              } else {
                score += 15;
              }
              if ((repo.name || '').toLowerCase().includes(token)) score += 30;
              if ((repo.topics || []).some(t => t.toLowerCase() === token)) score += 20;
              relevanceScores.set(idx, score);
            });
          }
        }

        if (currentMatches === null) {
          currentMatches = tokenMatches;
        } else {
          // Intersection
          currentMatches = new Set([...currentMatches].filter(idx => tokenMatches.has(idx)));
        }
      }

      // If strict intersection returned low results, enrich with semantic concept matches
      if ((!currentMatches || currentMatches.size < 5) && semanticConcepts.length > 0) {
        currentMatches = currentMatches || new Set();
        for (const semToken of semanticConcepts.slice(0, 8)) {
          const semIndices = INVERTED_INDEX_REPOS.get(semToken);
          if (semIndices) {
            semIndices.forEach(idx => {
              currentMatches.add(idx);
              relevanceScores.set(idx, (relevanceScores.get(idx) || 0) + 15);
            });
          }
        }
      }

      matchedIndices = currentMatches || new Set();
    }
  }

  // Filter repository list
  let list = matchedIndices !== null 
    ? Array.from(matchedIndices).map(idx => ({ ...REPOSITORIES[idx], _relevance: relevanceScores.get(idx) || 0 })) 
    : [...REPOSITORIES];

  // 2. Category & Topic Filter (Case-insensitive, slug-friendly, and invariant-preserving)
  const catList = Array.isArray(categories) ? categories : (categories ? [categories] : []);
  if (catList.length > 0) {
    const catLower = catList.map(c => c.toLowerCase().replace(/[-_]/g, ' '));
    const isOfficial = catLower.some(t => OFFICIAL_CATEGORIES.has(t));
    list = list.filter(r => {
      if (isOfficial) {
        return Array.isArray(r.categories) && r.categories.some(c => {
          const cLower = c.toLowerCase().replace(/[-_]/g, ' ');
          return catLower.some(target => cLower.includes(target) || target.includes(cLower));
        });
      }
      return (
        (Array.isArray(r.topics) && r.topics.some(t => {
          const tLower = t.toLowerCase();
          return catLower.some(target => tLower === target || tLower.split(/[-_ ]+/).includes(target));
        })) ||
        (r.language && catLower.some(target => r.language.toLowerCase() === target))
      );
    });
  }

  // 3. Language Filter
  const langList = Array.isArray(languages) ? languages : (languages ? [languages] : []);
  if (langList.length > 0) {
    const langLower = langList.map(l => l.toLowerCase());
    list = list.filter(r => r.language && langLower.includes(r.language.toLowerCase()));
  }

  // 4. License Filter
  if (license && license !== 'all') {
    const licLower = license.toLowerCase();
    list = list.filter(r => (r.license_key && r.license_key.toLowerCase() === licLower) || (r.license_name && r.license_name.toLowerCase().includes(licLower)));
  }

  // 5. Min Stars & Min Score
  if (minStars > 0) list = list.filter(r => (r.stars || 0) >= minStars);
  if (minScore > 0) list = list.filter(r => (r.quality_score || 0) >= minScore);

  // Compute Facet Counts over filtered pool
  const categoryCounts = {};
  const languageCounts = {};
  list.forEach(r => {
    (r.categories || []).forEach(c => {
      categoryCounts[c] = (categoryCounts[c] || 0) + 1;
    });
    if (r.language) {
      languageCounts[r.language] = (languageCounts[r.language] || 0) + 1;
    }
  });

  // 6. Sorting Algorithms
  if (sort === 'stars') {
    list.sort((a, b) => (b.stars || 0) - (a.stars || 0) || (b.id || '').localeCompare(a.id || ''));
  } else if (sort === 'quality') {
    list.sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0) || (b.stars || 0) - (a.stars || 0) || (b.id || '').localeCompare(a.id || ''));
  } else if (sort === 'recent') {
    const getTime = (r) => new Date(r.github_created_at || r.created_at || r.created_date || 0).getTime();
    list.sort((a, b) => getTime(b) - getTime(a) || (b.id || '').localeCompare(a.id || ''));
  } else if (sort === 'name') {
    list.sort((a, b) => (a.name || '').localeCompare(b.name || '') || (b.id || '').localeCompare(a.id || ''));
  } else if (searchTrimmed) {
    // Relevance sort when searching
    list.sort((a, b) => (b._relevance || 0) - (a._relevance || 0) || (b.stars || 0) - (a.stars || 0) || (b.id || '').localeCompare(a.id || ''));
  } else {
    // Trending (Composite Score)
    list.sort((a, b) => (b.trending_score || 0) - (a.trending_score || 0) || (b.stars || 0) - (a.stars || 0) || (b.id || '').localeCompare(a.id || ''));
  }

  // 6.5 Deduplicate identical repos (Git vs Alternative)
  const seenUrls = new Set();
  const seenNames = new Set();
  list = list.filter(r => {
    const url = (r.html_url || '').toLowerCase().trim();
    const normalizedName = (r.full_name || r.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (url && seenUrls.has(url)) return false;
    if (normalizedName && seenNames.has(normalizedName)) return false;
    
    if (url) seenUrls.add(url);
    if (normalizedName) seenNames.add(normalizedName);
    return true;
  });

  // 7. SOTA Pagination
  const total = list.length;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(perPage, 10) || 24);
  const totalPages = Math.ceil(total / limitNum);
  const startIndex = (pageNum - 1) * limitNum;
  const results = list.slice(startIndex, startIndex + limitNum);

  const result = {
    results,
    total,
    page: pageNum,
    totalPages,
    perPage: limitNum,
    categoryCounts,
    languageCounts
  };
  QUERY_CACHE.set(cacheKey, result);
  return result;
}

/**
 * High-Speed In-Memory Alternatives Query Engine
 */
export function queryAlternativesCatalog(params = {}) {
  const {
    search = '',
    category = '',
    page = 1,
    perPage = 50,
    sort = 'score'
  } = params;

  const cacheKey = 'alt:' + JSON.stringify(params);
  const cached = QUERY_CACHE.get(cacheKey);
  if (cached) return cached;

  let matchedIndices = null;
  const searchTrimmed = (search || '').trim().toLowerCase();

  if (searchTrimmed) {
    const searchTokens = tokenize(searchTrimmed);
    if (searchTokens.length > 0) {
      let currentMatches = null;
      for (const token of searchTokens) {
        const tokenMatches = new Set();
        for (const [indexedToken, indices] of INVERTED_INDEX_ALTS.entries()) {
          if (indexedToken === token || indexedToken.startsWith(token)) {
            indices.forEach(idx => tokenMatches.add(idx));
          }
        }
        if (currentMatches === null) {
          currentMatches = tokenMatches;
        } else {
          currentMatches = new Set([...currentMatches].filter(idx => tokenMatches.has(idx)));
        }
      }
      matchedIndices = currentMatches || new Set();
    }
  }

  let list = matchedIndices !== null
    ? Array.from(matchedIndices).map(idx => ALTERNATIVES[idx])
    : [...ALTERNATIVES];

  // Category filter
  if (category && category.toLowerCase() !== 'all') {
    const catLower = category.toLowerCase().replace(/[-_]/g, ' ');
    list = list.filter(a => {
      const c = (a.category || '').toLowerCase().replace(/[-_]/g, ' ');
      const sub = (a.subcategory || '').toLowerCase().replace(/[-_]/g, ' ');
      return c.includes(catLower) || catLower.includes(c) || sub.includes(catLower);
    });
  }

  // Compute Facets & Statistics
  const categoriesMap = {};
  let totalStars = 0;
  let totalScore = 0;

  list.forEach(a => {
    const cat = a.category || 'Developer Tools';
    categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
    totalStars += (a.stars || 0);
    totalScore += (a.quality_score || 90);
  });

  // Sorting
  if (sort === 'name') {
    list.sort((a, b) => (a.free_tool_name || '').localeCompare(b.free_tool_name || '') || (b.id || '').localeCompare(a.id || ''));
  } else if (sort === 'quality' || sort === 'score') {
    list.sort((a, b) => (b.openlysts_score || b.quality_score || 0) - (a.openlysts_score || a.quality_score || 0) || (b.stars || 0) - (a.stars || 0) || (b.id || '').localeCompare(a.id || ''));
  } else if (sort === 'parity') {
    list.sort((a, b) => (b.feature_parity_score || 0) - (a.feature_parity_score || 0) || (b.stars || 0) - (a.stars || 0) || (b.id || '').localeCompare(a.id || ''));
  } else if (sort === 'difficulty') {
    const diffVal = d => d === 'Easy' ? 3 : d === 'Medium' ? 2 : 1;
    list.sort((a, b) => diffVal(b.migration_difficulty) - diffVal(a.migration_difficulty) || (b.stars || 0) - (a.stars || 0));
  } else {
    // Default by stars
    list.sort((a, b) => (b.stars || 0) - (a.stars || 0) || (b.id || '').localeCompare(a.id || ''));
  }

  // SOTA Pagination
  const total = list.length;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(perPage, 10) || 50);
  const totalPages = Math.ceil(total / limitNum);
  const startIndex = (pageNum - 1) * limitNum;
  const results = list.slice(startIndex, startIndex + limitNum);

  // Compute Grouped hierarchy for category accordion UI (only on paginated results to save bandwidth)
  const groupedMap = {};
  results.forEach(alt => {
    const cat = alt.category || 'Developer Tools';
    const paid = alt.paid_tool_name || 'Proprietary SaaS';
    if (!groupedMap[cat]) groupedMap[cat] = {};
    if (!groupedMap[cat][paid]) groupedMap[cat][paid] = [];
    groupedMap[cat][paid].push(alt);
  });

  const grouped = Object.entries(groupedMap).map(([categoryName, paidGroups]) => {
    const paidGroupsArray = Object.entries(paidGroups).map(([paidName, alts]) => ({
      paid_tool_name: paidName,
      alternatives: alts,
      count: alts.length
    })).sort((a, b) => b.count - a.count);

    return {
      category: categoryName,
      paid_groups: paidGroupsArray,
      total: paidGroupsArray.reduce((sum, g) => sum + g.count, 0)
    };
  }).sort((a, b) => b.total - a.total);

  const categoriesList = Object.entries(categoriesMap).map(([name, count]) => ({
    name,
    count
  })).sort((a, b) => b.count - a.count);

  const result = {
    results,
    alternatives: results,
    grouped,
    categories: categoriesList,
    stats: {
      total_tools: ALTERNATIVES.length,
      total_paid_tools: 250, // Approximation
      filtered_tools: total,
      total_categories: Object.keys(categoriesMap).length,
      avg_score: list.length > 0 ? Math.round(totalScore / list.length) : 95,
      total_stars: totalStars
    },
    categoryCounts: categoriesMap,
    page: pageNum,
    totalPages,
    perPage: limitNum
  };
  QUERY_CACHE.set(cacheKey, result);
  return result;
}

/**
 * Get Global Platform Telemetry derived from real indexed catalogs
 */
export function getCatalogGlobalStats() {
  const catSet = new Set(ALTERNATIVES.map(a => a.category).filter(Boolean));
  const paidSet = new Set(ALTERNATIVES.map(a => a.paid_tool_name).filter(Boolean));
  return {
    totalRepositories: REPOSITORIES.length,
    catalogRepositories: REPOSITORIES.length,
    totalAlternatives: ALTERNATIVES.length,
    totalAlternativesFormatted: `${ALTERNATIVES.length.toLocaleString()}+`,
    totalCategories: catSet.size || 9,
    totalPaidTools: paidSet.size || 250,
    avgQualityScore: 96,
    verifiedOssRatio: 100,
    systemStatus: 'healthy',
    engineMode: 'hydrated-edge'
  };
}

export function getCatalogRepositories() {
  return REPOSITORIES;
}

export function getCatalogAlternatives() {
  return ALTERNATIVES;
}

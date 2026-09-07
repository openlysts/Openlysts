import express from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { getCatalogRepositories } from '../services/catalogEngine.js';
import { validateBody } from '../middleware/validation.js';

const router = express.Router();

// Community curation is open to anonymous visitors (same as browsing), so the
// POST endpoint is guarded by per-IP rate limiting + strict schema validation
// instead of an auth wall.
const collectionCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many collections created. Please try again later.' } },
});

const collectionSchema = z.object({
  title: z.string().trim().min(3, 'Collection title must be at least 3 characters.').max(80, 'Collection title cannot exceed 80 characters.'),
  description: z.string().trim().max(500, 'Collection description cannot exceed 500 characters.').optional(),
  tags: z.array(z.string().trim().min(1).max(30, 'Tags cannot exceed 30 characters.')).max(10, 'A collection can have at most 10 tags.').optional(),
  repo_names: z.array(z.string().trim().min(1).max(100, 'Repository names cannot exceed 100 characters.')).max(25, 'A collection can contain at most 25 repositories.').optional(),
}).strict();

const SEED_COLLECTIONS = [
  {
    id: 'col-sovereign-ai',
    title: 'Sovereign AI & Agentic Stack',
    slug: 'sovereign-ai',
    description: 'Autonomous agents, local LLM inferencing engines, and private knowledge bases.',
    tags: ['ai', 'agent', 'llm', 'rag'],
    repo_names: ['ollama', 'vllm', 'langfuse', 'CopilotKit', 'autogen'],
    curator: 'Openlysts Core',
    stars_total: 185000,
  },
  {
    id: 'col-rust-infra',
    title: 'High-Performance Rust Utilities',
    slug: 'rust-infra',
    description: 'Blazingly fast system tools, command-line utilities, and core sovereign infrastructure.',
    tags: ['rust', 'cli', 'system', 'terminal'],
    repo_names: ['ripgrep', 'bat', 'fd', 'eza', 'alacritty'],
    curator: 'Systems SIG',
    stars_total: 142000,
  },
  {
    id: 'col-dataviz-charts',
    title: 'Modern Dataviz & Canvas Engines',
    slug: 'dataviz-charts',
    description: 'Interactive charting libraries, WebGL graphs, and dashboard primitives.',
    tags: ['dataviz', 'charts', 'visualization', 'canvas'],
    repo_names: ['recharts', 'chartbrew', 'flowbite-admin-dashboard', 'd3'],
    curator: 'Design Engineering',
    stars_total: 96000,
  },
  {
    id: 'col-dev-productivity',
    title: 'Next-Gen Developer Productivity',
    slug: 'dev-productivity',
    description: 'Terminal accelerators, modern shells, and git workflow optimizers.',
    tags: ['productivity', 'git', 'terminal', 'tools'],
    repo_names: ['neovim', 'starship', 'lazygit', 'helix'],
    curator: 'DevEx Community',
    stars_total: 165000,
  }
];

// In-memory collection storage (session cache). User collections are
// persisted to Neon via the "Collection" table and hydrated back here so they
// survive restarts / Vercel cold starts. If the DB is unreachable the API
// falls back to memory-only so browsing + creation still work.
const USER_COLLECTIONS = [];
let collectionsLoaded = false;
let lastDbLoadAt = 0;
const DB_RELOAD_MS = 60 * 1000;
let dbWarned = false;

function parseJsonList(raw) {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

async function ensureCollectionTable(db) {
  await db.query('CREATE TABLE IF NOT EXISTS "Collection" ('
    + 'id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL, '
    + 'description TEXT, tags TEXT NOT NULL DEFAULT \'[]\', repo_names TEXT NOT NULL DEFAULT \'[]\', '
    + 'curator TEXT, stars_total REAL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_collection_slug ON "Collection"(slug)');
}

async function loadUserCollectionsFromDb() {
  try {
    const { db } = await import('../db/index.js');
    await ensureCollectionTable(db);
    const { rows } = await db.query(
      'SELECT id, title, slug, description, tags, repo_names, curator, stars_total, created_at FROM "Collection" ORDER BY created_at DESC LIMIT 200'
    );
    USER_COLLECTIONS.length = 0;
    for (const row of rows) {
      USER_COLLECTIONS.push({
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description || '',
        tags: parseJsonList(row.tags),
        repo_names: parseJsonList(row.repo_names),
        curator: row.curator || 'Community Member',
        stars_total: Number(row.stars_total) || 0,
        created_at: row.created_at,
      });
    }
    collectionsLoaded = true;
    lastDbLoadAt = Date.now();
    dbWarned = false;
  } catch (err) {
    if (!dbWarned) {
      console.warn('[Collections] DB load failed, using memory-only:', err.message);
      dbWarned = true;
    }
  }
}

async function ensureCollectionsLoaded(force = false) {
  if (force || !collectionsLoaded || Date.now() - lastDbLoadAt > DB_RELOAD_MS) {
    await loadUserCollectionsFromDb();
  }
}

/**
 * Hydrate collection repo_names with real metadata from the in-memory catalog
 */
function hydrateCollectionRepos(collection) {
  const allRepos = getCatalogRepositories() || [];
  const populated = [];

  for (const name of collection.repo_names || []) {
    const target = name.toLowerCase();
    const found = allRepos.find(r => 
      (r.name && r.name.toLowerCase() === target) ||
      (r.full_name && r.full_name.toLowerCase().includes(target))
    );
    if (found) {
      populated.push(found);
    }
  }

  return {
    ...collection,
    repositories: populated,
    repo_count: populated.length || collection.repo_names?.length || 0,
  };
}

// GET /api/collections
router.get('/', async (req, res) => {
  await ensureCollectionsLoaded();
  const combined = [...SEED_COLLECTIONS, ...USER_COLLECTIONS];
  const hydrated = combined.map(hydrateCollectionRepos);

  res.setHeader('Cache-Control', 'no-store');
  res.json({
    ok: true,
    count: hydrated.length,
    collections: hydrated,
  });
});

// GET /api/collections/:slug
router.get('/:slug', async (req, res) => {
  await ensureCollectionsLoaded();
  const { slug } = req.params;
  const combined = [...SEED_COLLECTIONS, ...USER_COLLECTIONS];
  const found = combined.find(c => c.slug === slug || c.id === slug);

  if (!found) {
    return res.status(404).json({ error: true, message: `Collection "${slug}" not found.` });
  }

  res.setHeader('Cache-Control', 'no-store');
  res.json({
    ok: true,
    collection: hydrateCollectionRepos(found),
  });
});

// POST /api/collections (Community curation)
router.post('/', collectionCreateLimiter, validateBody(collectionSchema), async (req, res) => {
  const { title, description, tags = [], repo_names = [] } = req.validatedBody;

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const now = new Date().toISOString();
  const newCol = {
    id: `col-user-${Date.now()}`,
    title: title.trim(),
    slug: slug || `col-${Date.now()}`,
    description: (description || 'Community-curated collection of open-source tools.').trim(),
    tags: tags.map(t => String(t).toLowerCase().trim()).filter(Boolean),
    repo_names: repo_names.map(r => String(r).trim()).filter(Boolean),
    curator: 'Community Member',
    stars_total: 0,
    created_at: now,
  };

  // Persist to Neon first; if the write fails the collection still exists
  // for this session (memory fallback) but won't survive a restart.
  try {
    const { db } = await import('../db/index.js');
    await ensureCollectionTable(db);
    await db.query(
      `INSERT INTO "Collection" (id, title, slug, description, tags, repo_names, curator, stars_total, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        newCol.id, newCol.title, newCol.slug, newCol.description,
        JSON.stringify(newCol.tags), JSON.stringify(newCol.repo_names),
        newCol.curator, newCol.stars_total, newCol.created_at, now,
      ]
    );
    collectionsLoaded = true;
  } catch (err) {
    console.warn('[Collections] Persist failed (memory-only for this session):', err.message);
  }

  USER_COLLECTIONS.unshift(newCol);

  res.status(201).json({
    ok: true,
    message: 'Collection created successfully.',
    collection: hydrateCollectionRepos(newCol),
  });
});

export default router;
export { SEED_COLLECTIONS, hydrateCollectionRepos };

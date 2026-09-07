import './env.js';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import { db } from './db/index.js';
import { getSystemConfig } from './config.js';
import { configureSession } from './auth/session.js';
import { loadSessionUser, csrfProtection, generalRateLimiter } from './auth/middleware.js';
import { autoBootstrapFromEnv } from './auth/bootstrap.js';

import authRouter from './api/auth.js';
import mfaRouter from './api/mfa.js';
import adminRouter from './api/admin.js';
import profileRouter from './api/profile.js';
import entitiesRouter from './api/entities.js';
import altGraphRouter from './api/altgraph.js';
import functionsRouter from './api/functions.js';
import contactRouter from './api/contact.js';
import dataRightsRouter from './api/data-rights.js';
import clientErrorsRouter from './api/client-errors.js';
import collectionsRouter from './api/collections.js';
import recommendationsRouter from './api/recommendations.js';
import featureFlagsRouter from './api/featureFlags.js';
import sponsorshipsRouter from './api/sponsorships.js';
import { refreshTransferMode, isTransferCritical, isTransferWarn } from './services/transferGuard.js';
import { executeIngestion } from './functions/runIngestion.js';
import { ingestAlternatives } from './functions/ingestAlternatives.js';
import { prewarmRepositoriesCache } from './functions/queryRepositories.js';
import { prewarmAlternativesCache } from './functions/queryAlternatives.js';
import { syncDeltasFromDB, getCatalogRepositories } from './services/catalogEngine.js';
import { prewarmStatsCounters } from './functions/getGlobalStats.js';
import { limitMonitor } from './services/limitMonitor.js';
import { tokenRotation } from './services/tokenRotation.js';
import { deltaSync } from './services/deltaSync.js';
import { selfHealingIngestion } from './services/selfHealingIngestion.js';
import { autoScaling } from './services/autoScaling.js';
import { runWindowCycle } from './services/windowDiscovery.js';
import { ensureAltGraphTables, promotionSweep } from './services/altGraph.js';
import { refreshAltGraph } from './services/altSources.js';
import { errorTracker } from './services/errorTracker.js';
import { requestLogger } from './middleware/requestLogger.js';
import { ensureRequestId, inferErrorCode, responseErrorEnvelope } from './middleware/errorEnvelope.js';

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = [
  process.env.APP_URL,
  'http://localhost:5173',
  'http://localhost:3001',
  'https://openlysts.dpdns.org',
  'https://openlysts.vercel.app',
  'https://openlyst.vercel.app',
].filter(Boolean).map(u => u.replace(/\/$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || /^https?:\/\/(localhost|127\.\d{1,3}\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/i.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      // sha256 hashes allow the two deliberate inline scripts in index.html:
      // the theme pre-paint snippet (data-theme before first render) and the
      // service-worker registration block. If either snippet changes, recompute
      // the hash (sha256 of the script body as parsed by the browser) and update.
      scriptSrc: [
        "'self'",
        "https://vercel.live",
        "https://challenges.cloudflare.com",
        "https://news.google.com",
        "'sha256-ioYhoZptZPnafBYaERnLLXJHRQyh0QaVX425qsf6kEI='",
        "'sha256-fQWA1wV7l5cQZ4Frvz1hF+gUy3q+6njj7lrBw4es0NE='",
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.github.com", "https://news.google.com"],
      frameSrc: ["'self'", "https://www.youtube.com", "https://challenges.cloudflare.com", "https://news.google.com"],
      upgradeInsecureRequests: [],
      reportUri: '/api/admin/csp-report',
    },
  },
}));

// gzip/brotli compression for API JSON + static assets (self-hosted mode; Vercel
// already compresses at the edge, so this only runs when serving locally)
app.use(compression());

app.use('/api/entities', express.json({ limit: '2mb', strict: true }));
app.use('/api/admin', express.json({ limit: '2mb', strict: true }));
app.use(express.json({ limit: '100kb', strict: true }));

// Express only populates req.body for matched content-types; without this,
// a text/plain (or empty) request leaves req.body undefined and every route
// destructuring it throws a 500 instead of a clean 4xx.
app.use((req, res, next) => {
  if (req.body === undefined) req.body = {};
  next();
});
// Requests whose Content-Type is not JSON never reach the parser, leaving
// req.body undefined in Express 5 — a handler that destructures it would 500.
// Default to {} so validation runs and returns 400 instead of crashing.
app.use((req, res, next) => {
  if (req.body === undefined) req.body = {};
  next();
});

configureSession(app);
app.use(loadSessionUser);
app.use(csrfProtection);

app.use('/api', generalRateLimiter);

// Attach a traceable request id to every request (used in logs + error envelopes)
app.use((req, res, next) => {
  ensureRequestId(req);
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

// Track API response bytes served (live, in-process) for the admin
// free-tier budget panel's Vercel-bandwidth estimate.
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.on('finish', () => {
      const len = Number(res.getHeader('content-length')) || 0;
      globalThis.__openlystsApiBytes = (globalThis.__openlystsApiBytes || 0) + len;
    });
  }
  next();
});

// Additive error envelope: inject code + requestId into every error response
app.use(responseErrorEnvelope);

// Structured request logging (JSON lines, skips health checks)
app.use(requestLogger());



const healthHandler = async (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// ─── SEO: robots.txt + sitemap.xml ───────────────────────────────────
const SEO_BASE = process.env.APP_URL || 'https://openlysts.dpdns.org';

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(
    `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /auth/\nDisallow: /admin\nSitemap: ${SEO_BASE}/sitemap.xml\n`
  );
});

app.get('/sitemap.xml', async (req, res) => {
  try {
    const now = new Date().toISOString().slice(0, 10);
    const staticPaths = [
      '', 'discover', 'alternatives', 'trending', 'about', 'contact',
      'privacy', 'terms', 'cookies', 'bookmarks',
    ];
    let urls = staticPaths.map(p => `  <url><loc>${SEO_BASE}/${p}</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq></url>`);
    // Top 1000 catalog repos (highest-stars) give search engines deep links.
    const repos = getCatalogRepositories() || [];
    const top = [...repos]
      .filter(r => r && r.full_name)
      .sort((a, b) => (b.stars || 0) - (a.stars || 0))
      .slice(0, 1000);
    for (const r of top) {
      const [owner, name] = (r.full_name || '').split('/');
      if (owner && name) {
        urls.push(`  <url><loc>${SEO_BASE}/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq></url>`);
      }
    }
    res.type('application/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
    );
  } catch (e) {
    res.status(500).type('text/plain').send('sitemap generation failed');
  }
});

// Maintenance Mode Interceptor
app.use(async (req, res, next) => {
  // Let auth and admin routes pass so admins can log in and manage the site
  if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/admin')) {
    return next();
  }
  
  // Admins bypass maintenance mode
  if (req.user?.role === 'ADMIN') {
    return next();
  }

  try {
    const maintenanceMode = await getSystemConfig('maintenance_mode');
    if (maintenanceMode === 'true') {
      return res.status(503).json({ 
        error: true, 
        message: 'Openlysts is currently undergoing maintenance. Please check back later.',
        maintenance: true
      });
    }
  } catch (e) {
    console.error('[API] Error checking maintenance mode:', e);
  }
  next();
});

app.use('/api/auth', authRouter);
app.use('/api/mfa', mfaRouter);
app.use('/api/admin', adminRouter);
app.use('/api/profile', profileRouter);
app.use('/api/entities', entitiesRouter);
app.use('/api/functions', functionsRouter);
app.use('/api/altgraph', altGraphRouter);
app.use('/api/contact', contactRouter);
app.use('/api/data-rights', dataRightsRouter);
app.use('/api/client-errors', clientErrorsRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/feature-flags', featureFlagsRouter);
app.use('/api/sponsorships', sponsorshipsRouter);

// Serve standalone animated landing page preview (docs/index.html)
app.use('/preview', express.static(path.resolve(__dirname, '../docs')));
app.get('/preview', (req, res) => {
  res.sendFile('index.html', { root: path.resolve(__dirname, '../docs') });
});

const isDevMode = process.argv.includes('--dev');

if (!isDevMode) {
  // Serve static frontend files (used only in self-hosted standalone server)
  const distPath = path.resolve(__dirname, '../dist');
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.startsWith('/auth/')) {
      // Use the root-relative form: Express 5.2.x returns a bare 404 for
      // sendFile() with an absolute Windows path even when the file exists.
      return res.sendFile('index.html', { root: distPath });
    }
    next();
  });
} else {
  // Development mode fallback: Prevent serving stale dist/ folder which causes "localhost doesn't work" confusion
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.startsWith('/auth/')) {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Openlysts API Server</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #fafafa; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 40px; text-align: center; max-width: 500px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5); }
              h1 { margin-top: 0; color: #a1a1aa; }
              a { display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #fafafa; color: #18181b; text-decoration: none; font-weight: 600; border-radius: 6px; transition: opacity 0.2s; }
              a:hover { opacity: 0.9; }
              .note { margin-top: 30px; font-size: 13px; color: #71717a; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>API Server is Running</h1>
              <p>You have accessed the backend Express server on port <strong>${PORT}</strong>.</p>
              <p>To view the Openlysts frontend with hot-reloading enabled, please open the Vite development server:</p>
              <a href="http://localhost:5173">Go to http://localhost:5173</a>
              <p class="note">Note: Serving static files from the <code>/dist</code> folder is disabled in development mode to prevent stale UI issues after a deployment.</p>
            </div>
          </body>
        </html>
      `);
    }
    next();
  });
}

// JSON 404 for unknown API routes (must run before static SPA fallback)
app.use('/api', (req, res) => {
  ensureRequestId(req);
  const fullPath = req.originalUrl || req.url;
  res.status(404).json({
    error: true,
    code: 'NOT_FOUND',
    message: `Route not found: ${req.method} ${fullPath}`,
    requestId: req.requestId,
  });
});

// Centralized JSON error handling
app.use((err, req, res, next) => {
  ensureRequestId(req);
  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

  const fullPath = req.originalUrl || req.url || req.path;

  // Track every 5xx in the in-memory error tracker (mark as tracked so the
  // request logger does not double-count the same failure)
  if (status >= 500) {
    res.locals.errorTracked = true;
    errorTracker.capture(err, {
      code: err.code || 'INTERNAL_ERROR',
      status,
      method: req.method,
      path: fullPath,
      requestId: req.requestId,
      userId: req.user?.id,
      stack: err.stack,
    });
  }

  if (isProd && status >= 500) console.error('[ERROR]', status, req.method, fullPath, err.message);

  const body = {
    error: true,
    message: isProd && status >= 500 ? 'Internal Server Error' : (err.message || 'Internal Server Error'),
    code: err.code || inferErrorCode(status, err.message),
    requestId: req.requestId,
  };
  if (err.details !== undefined) body.details = err.details;

  res.status(status).json(body);
});

export default app;

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  app.listen(PORT, async () => {
    console.log(`Express server running on http://localhost:${PORT}`);

    // The bundled catalog (mega_repositories_catalog.json.gz) is a static Aug-29
    // snapshot and persist is disabled in production, so the ONLY way repos the
    // autonomous ingestion writes to Neon reach the served catalog is a fuse on
    // every boot. Without this the visible count stays frozen at the gz size
    // (49,523) even as Neon grows — do it before prewarm so feeds + stats are
    // correct from the very first request.
    try {
      await syncDeltasFromDB(true);
      console.log('[CATALOG] Fused Neon deltas into the in-memory catalog.');
    } catch (fuseErr) {
      console.warn('[CATALOG] Boot fuse warning:', fuseErr.message);
    }
    
    // Immediately prewarm in-memory caches on boot so GUI gets instant sub-20ms responses
    try {
      console.log('[CACHE] Prewarming Repository and Alternatives caches...');
      await Promise.all([
        prewarmRepositoriesCache(),
        prewarmAlternativesCache()
      ]);
      console.log('[CACHE] Prewarming completed. Ready for instant GUI responses.');
    } catch (cacheErr) {
      console.warn('[CACHE] Prewarm warning:', cacheErr.message);
    }

    // Warm the stats counters (long-tail count) so the first /stats request
    // never pays Neon's serverless cold wake (~2-4.5s TLS per new connection).
    prewarmStatsCounters().then(n => {
      console.log(`[STATS] Counters prewarmed (long-tail: ${n}).`);
    }).catch(e => console.warn('[STATS] Counter prewarm warning:', e.message));

    // Start limit monitor
    limitMonitor.start();

    // Neon transfer guard: evaluate once on boot, then re-evaluate every
    // 30 min from the cached Neon usage figure (zero extra API calls).
    refreshTransferMode({ force: true });
    setInterval(() => refreshTransferMode(), 30 * 60 * 1000);

    // Initialize token rotation pool
    tokenRotation.init();

    // Initial delta sync on boot (pulls any changes since last run)
    deltaSync.sync({ force: true }).then(r => {
      if (r.reposSynced > 0 || r.altsSynced > 0) {
        console.log(`[BOOT] Delta sync: ${r.reposSynced} repos, ${r.altsSynced} alts`);
      }
    }).catch(e => console.warn('[BOOT] Delta sync warning:', e.message));

    // Auto-Ingestion Loop (Every 10 minutes) with self-healing + auto-scaling
    // Only run in local/standalone mode. On Vercel, this is handled by Vercel Cron.
    // Gate on the SERVERLESS runtime signal, NOT `VERCEL`: `vercel env pull`
    // writes VERCEL=1 into the local .env, which used to silently disable all
    // background machinery (reconcile/ingestion/seed) in local runs. Real
    // Vercel functions are already excluded by `isMainModule` above (the module
    // is imported there, never executed as main), so this check only needs to
    // keep background loops out of an actual Lambda invocation.
    if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
      const TEN_MINUTES = 10 * 60 * 1000;
      setInterval(async () => {
        try {
          const params = autoScaling.calculateOptimalParams();
          if (isTransferCritical()) { console.log("[TRANSFER-GUARD] Skipping ingestion — transfer critical"); return; }
          console.log(`[AUTO-SCALING] batch=${params.batchSize} queries=${params.maxQueries} scale=${params.scaleFactor}`);
          await selfHealingIngestion.runProtectedIngestion(executeIngestion);
        } catch (err) {
          console.warn('[INGESTION] Self-healing run failed (will retry next cycle):', err.message);
        }
      }, TEN_MINUTES);

      // Auto-Ingest Alternatives (Every 6 hours)
      const SIX_HOURS = 6 * 60 * 60 * 1000;
      setInterval(async () => {
        try {
          if (isTransferCritical()) { console.log("[TRANSFER-GUARD] Skipping alternatives ingest — transfer critical"); return; }
          await ingestAlternatives();
        } catch (err) {
          // Suppress expected DB throttling warnings in background
        }
      }, SIX_HOURS);

      // Reconcile Neon → catalog every 5 minutes so repos the ingestion cycle
      // writes to Neon show up in the served catalog between restarts (the
      // bundled gz never updates and persist is disabled in production).
      const FIVE_MINUTES = 5 * 60 * 1000;
      setInterval(async () => {
        const __t = Date.now();
        try {
          if (isTransferCritical()) { console.log("[TRANSFER-GUARD] Skipping reconcile — transfer critical"); return; }
          const n = await syncDeltasFromDB(true);
          console.log(`[CATALOG] Reconcile done: ${n || 0} deltas in ${((Date.now() - __t) / 1000).toFixed(1)}s`);
        } catch (err) {
          console.warn('[CATALOG] Reconcile warning:', err.message);
        }
      }, FIVE_MINUTES);

      // ── Alternatives Knowledge Graph tables (idempotent first-use) ──
      ensureAltGraphTables(db).then(() => {
        // Seed + backfill the graph from curated sources once at boot so the
        // endpoint answers with real edges immediately (both are no-touch
        // after the first run).
        return refreshAltGraph(db, { awesome: false, demand: false, seed: true, backfill: true });
      }).catch(e => console.warn('[ALTGRAPH] boot seed warning:', e.message));

      // Star-window enumeration: genuinely additive growth, bounded to 6
      // search queries per cycle so GitHub's 30/min search quota is never
      // approached and Neon storage caps gate every write (quotaGuard).
      const WINDOW_EVERY_MS = 30 * 60 * 1000; // Reduced from 6min to 30min to save Neon transfer
      const runWindowTick = async () => {
        try {
          if (isTransferCritical()) { console.log("[TRANSFER-GUARD] Skipping window tick — transfer critical"); return; }
          const ramKnown = new Set(
            (getCatalogRepositories() || [])
              .map(r => (r.full_name || '').toLowerCase())
              .filter(Boolean)
          );
          const stats = await runWindowCycle({
            db,
            maxQueries: Number(process.env.WINDOW_QUERIES_PER_CYCLE) || 6,
            preferPending: true,
            ramKnown,
          });
          if (stats.queries > 0 || stats.inserted > 0) {
            console.log('[WINDOWS] cycle: ' + stats.queries + ' queries, ' + stats.inserted + '+' + stats.updated + ' long-tail rows (' + stats.split + ' windows split)');
          }
        } catch (err) {
          console.warn('[WINDOWS] cycle warning:', err.message);
        }
      };
      setInterval(runWindowTick, WINDOW_EVERY_MS);

      // Graph refresh from the external sources (awesome list + demand queue)
      // every 6 hours alongside the curated alternatives ingest.
      setInterval(async () => {
          if (isTransferCritical()) { console.log("[TRANSFER-GUARD] Skipping altgraph refresh — transfer critical"); return; }
        try {
          const summary = await refreshAltGraph(db, { seed: true, backfill: true, awesome: true, demand: true });
          console.log('[ALTGRAPH] refresh:', JSON.stringify(summary).slice(0, 400));
        } catch (err) {
          console.warn('[ALTGRAPH] refresh warning:', err.message);
        }
      }, SIX_HOURS);

      // Vote quorum sweep every 6 hours: community edges that earned enough
      // distinct votes graduate to verified; rejected ones are revoked — no
      // human reviewer needed for the graph to stay honest.
          if (isTransferCritical()) { console.log("[TRANSFER-GUARD] Skipping vote sweep — transfer critical"); return; }
      setInterval(async () => {
        try {
          const r = await promotionSweep(db);
          if (r.promoted > 0 || r.revoked > 0) {
            console.log(`[ALTGRAPH] vote sweep: +${r.promoted} verified, -${r.revoked} revoked`);
          }
        } catch (err) {
          console.warn('[ALTGRAPH] vote sweep warning:', err.message);
        }
      }, SIX_HOURS);
    }
  });
}

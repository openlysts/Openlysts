import './env.js';
import express from 'express';
import cors from 'cors';
import { db } from './db/index.js';
import { configureSession } from './auth/session.js';
import { loadSessionUser, csrfProtection } from './auth/middleware.js';
import { autoBootstrapFromEnv } from './auth/bootstrap.js';

import authRouter from './api/auth.js';
import adminRouter from './api/admin.js';
import profileRouter from './api/profile.js';
import entitiesRouter from './api/entities.js';
import functionsRouter from './api/functions.js';
import contactRouter from './api/contact.js';
import { executeIngestion } from './functions/runIngestion.js';
import { ingestAlternatives } from './functions/ingestAlternatives.js';
import { prewarmRepositoriesCache } from './functions/queryRepositories.js';
import { prewarmAlternativesCache } from './functions/queryAlternatives.js';

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
  'https://openlysts.vercel.app',
  'https://openlyst.vercel.app',
].filter(Boolean).map(u => u.replace(/\/$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server) or valid origins
    if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use('/api/entities', express.json({ limit: '2mb' }));
app.use('/api/admin', express.json({ limit: '2mb' }));
app.use(express.json({ limit: '100kb' }));

configureSession(app);
app.use(loadSessionUser);
app.use(csrfProtection);

app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

import { initSchema } from './db/schema.js';

const healthHandler = async (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/profile', profileRouter);
app.use('/api/entities', entitiesRouter);
app.use('/api/functions', functionsRouter);
app.use('/api/contact', contactRouter);

const isDevMode = process.argv.includes('--dev');

if (!isDevMode) {
  // Serve static frontend files (used only in self-hosted standalone server)
  const distPath = path.resolve(__dirname, '../dist');
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.startsWith('/auth/')) {
      return res.sendFile(path.join(distPath, 'index.html'));
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

// Centralized JSON error handling
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
  res.status(500).json({
    error: true,
    message: isProd ? 'Internal Server Error' : (err.message || 'Internal Server Error'),
  });
});

export default app;

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  app.listen(PORT, async () => {
    console.log(`Express server running on http://localhost:${PORT}`);
    
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

    // Auto-Ingestion Loop (Every 10 minutes)
    const TEN_MINUTES = 10 * 60 * 1000;
    setInterval(async () => {
      try {
        await executeIngestion();
      } catch (err) {
        // Suppress expected DB throttling warnings in background
      }
    }, TEN_MINUTES);

    // Auto-Ingest Alternatives (Every 6 hours)
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    setInterval(async () => {
      try {
        await ingestAlternatives();
      } catch (err) {
        // Suppress expected DB throttling warnings in background
      }
    }, SIX_HOURS);
  });
}

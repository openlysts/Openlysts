import './env.js';
import express from 'express';
import cors from 'cors';
import { db } from './db/index.js';
import { configureSession } from './auth/session.js';
import { loadSessionUser } from './auth/middleware.js';
import { autoBootstrapFromEnv } from './auth/bootstrap.js';

import authRouter from './api/auth.js';
import adminRouter from './api/admin.js';
import profileRouter from './api/profile.js';
import entitiesRouter from './api/entities.js';
import functionsRouter from './api/functions.js';
import contactRouter from './api/contact.js';
import { executeIngestion } from './functions/runIngestion.js';
import { ingestAlternatives } from './functions/ingestAlternatives.js';

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

configureSession(app);
app.use(loadSessionUser);

app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

import { initSchema } from './db/schema.js';

app.get('/api/health', async (req, res) => {
  try {
    const schemaErrors = await initSchema(db);
    await autoBootstrapFromEnv(); // Bootstrap admin if env vars are present
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected and schema initialized', schemaErrors });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/profile', profileRouter);
app.use('/api/entities', entitiesRouter);
app.use('/api/functions', functionsRouter);
app.use('/api/contact', contactRouter);

// Serve static frontend files (used in production/Glitch)
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all to render the React app
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Centralized JSON error handling
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    error: true,
    message: err.message || 'Internal Server Error',
    details: err.details || null
  });
});

export default app;

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  app.listen(PORT, () => {
    console.log(`Express server running on http://localhost:${PORT}`);
    
    // Auto-Ingestion Loop (Every 10 minutes)
    const TEN_MINUTES = 10 * 60 * 1000;
    setInterval(async () => {
      try {
        console.log('[AUTO-INGESTION] Triggering scheduled ingestion...');
        await executeIngestion();
      } catch (err) {
        console.error('[AUTO-INGESTION] Failed:', err.message);
      }
    }, TEN_MINUTES);

    // Run it once on startup immediately
    setTimeout(() => executeIngestion().catch(console.error), 2000);

    // Auto-Ingest Alternatives (Every 6 hours)
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    setInterval(async () => {
      try {
        await ingestAlternatives();
      } catch (err) {
        console.error('[AUTO-INGESTION] Alternatives failed:', err.message);
      }
    }, SIX_HOURS);
    
    // Run once on startup
    setTimeout(() => ingestAlternatives().catch(console.error), 5000);
  });
}

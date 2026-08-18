import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db/index.js';
import entitiesRouter from './api/entities.js';
import functionsRouter from './api/functions.js';
import contactRouter from './api/contact.js';
import { executeIngestion } from './functions/runIngestion.js';
import { ingestAlternatives } from './functions/ingestAlternatives.js';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

app.use('/api/entities', entitiesRouter);
app.use('/api/functions', functionsRouter);
app.use('/api/contact', contactRouter);

// Centralized JSON error handling
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    error: true,
    message: err.message || 'Internal Server Error',
    details: err.details || null
  });
});

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

// ─── Session Configuration ──────────────────────────────────────────
// express-session + connect-pg-simple for PostgreSQL-backed sessions with memory fallback.

import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { db } from '../db/index.js';
import { TOKEN_EXPIRY } from './constants.js';

const PgSession = connectPgSimple(session);

/**
 * Configure and attach session middleware to Express app.
 * @param {import('express').Express} app
 */
export function configureSession(app) {
  const sessionSecret = process.env.SESSION_SECRET || 'openlysts-prod-secret-fallback-key-9f84a9e5b2d713c4';
  const appUrl = process.env.APP_URL || '';
  const isLocalhost = appUrl.includes('localhost') || appUrl.includes('127.0.0.1');
  const isSecure = isLocalhost ? false : (appUrl.startsWith('https://') || process.env.NODE_ENV === 'production' || !!process.env.VERCEL);

  app.set('trust proxy', 1); // Required for Vercel/reverse proxy (secure cookies)

  // Resilient session store with error suppression & fallback
  let store;
  try {
    store = new PgSession({
      pool: db,
      tableName: 'session',
      createTableIfMissing: false,
      pruneSessionInterval: false,
      errorLog: (err) => {
        // Suppress noisy fatal aborts when DB quota limit is reached
        console.warn('[SESSION] DB session warning:', err.message);
      }
    });
  } catch (e) {
    console.warn('[SESSION] Using MemoryStore fallback:', e.message);
    store = new session.MemoryStore();
  }

  app.use(session({
    store,
    secret: sessionSecret || 'local-dev-only-session-secret-do-not-use-in-prod',
    name: 'openlysts.sid',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: TOKEN_EXPIRY.SESSION_MAX_AGE,
      path: '/',
    },
  }));
}

// ─── Session Configuration ──────────────────────────────────────────
// express-session + connect-pg-simple for PostgreSQL-backed sessions.
// Works perfectly with Vercel serverless (stateless, DB-backed).

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
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret || sessionSecret.length < 32) {
    console.error('[AUTH] WARNING: SESSION_SECRET is missing or too short (min 32 chars).');
    console.error('[AUTH] Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    if (process.env.NODE_ENV === 'production') {
      console.error('[AUTH] CRITICAL: Cannot start in production without SESSION_SECRET.');
      process.exit(1);
    }
  }

  const appUrl = process.env.APP_URL || '';
  // Force secure=false for local development to prevent browser dropping the cookie
  const isLocalhost = appUrl.includes('localhost') || appUrl.includes('127.0.0.1');
  const isSecure = isLocalhost ? false : (appUrl.startsWith('https://') || process.env.NODE_ENV === 'production');

  app.set('trust proxy', 1); // Required for Vercel/reverse proxy (secure cookies)

  app.use(session({
    store: new PgSession({
      pool: db,            // Reuse existing pg Pool
      tableName: 'session', // Must match schema
      createTableIfMissing: false, // We create it in schema.js
      pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 min
    }),
    secret: sessionSecret || 'dev-insecure-secret-change-me',
    name: 'openlysts.sid',  // Custom cookie name (not the default 'connect.sid')
    resave: false,
    saveUninitialized: false, // Don't create session until user authenticates
    rolling: true,            // Reset expiry on every response
    cookie: {
      httpOnly: true,         // Not accessible via JavaScript
      secure: isSecure,       // HTTPS only (false on local HTTP dev)
      sameSite: 'lax',        // Protects against CSRF; allows OAuth redirects
      maxAge: TOKEN_EXPIRY.SESSION_MAX_AGE, // 7 days
      path: '/',
    },
  }));
}

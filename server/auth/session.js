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
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) throw new Error("FATAL: SESSION_SECRET environment variable is missing.");
  const appUrl = process.env.APP_URL || '';
  const isLocalhost = appUrl.includes('localhost') || appUrl.includes('127.0.0.1');
  const isSecure = isLocalhost ? false : (appUrl.startsWith('https://') || process.env.NODE_ENV === 'production' || !!process.env.VERCEL);

  app.set('trust proxy', 1);

  const memStore = new session.MemoryStore();
  let pgStore;
  try {
    pgStore = new PgSession({
      pool: db,
      tableName: 'session',
      createTableIfMissing: false,
      pruneSessionInterval: 60 * 60, // Prune expired sessions every hour
      errorLog: () => {}
    });
  } catch (e) {
    // fallback to memStore
  }

  // Resilient Hybrid Store that never lets DB errors abort the HTTP pipeline
  class ResilientStore extends session.Store {
    get(sid, callback) {
      if (pgStore) {
        pgStore.get(sid, (err, sessionData) => {
          if (err) {
            return memStore.get(sid, callback);
          }
          return callback(null, sessionData);
        });
      } else {
        memStore.get(sid, callback);
      }
    }

    set(sid, sessionData, callback) {
      memStore.set(sid, sessionData, () => {});
      if (pgStore) {
        pgStore.set(sid, sessionData, () => {
          if (typeof callback === 'function') callback();
        });
      } else if (typeof callback === 'function') {
        callback();
      }
    }

    destroy(sid, callback) {
      if (pgStore) {
        pgStore.destroy(sid, () => {});
      }
      memStore.destroy(sid, callback || (() => {}));
    }

    touch(sid, sessionData, callback) {
      if (pgStore && typeof pgStore.touch === 'function') {
        pgStore.touch(sid, sessionData, () => {
          if (typeof callback === 'function') callback();
        });
      } else if (typeof callback === 'function') {
        callback();
      }
    }
  }

  app.use(session({
    store: new ResilientStore(),
    secret: sessionSecret,
    name: isSecure ? '__Host-openlysts.sid' : 'openlysts.sid',
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

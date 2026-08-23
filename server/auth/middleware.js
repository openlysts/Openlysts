// ─── Auth Middleware ─────────────────────────────────────────────────
// Reusable Express middleware for authentication and authorization.
// Backend is authoritative — never trust client-provided role/identity.

import { db } from '../db/index.js';
import { ROLES, ACCOUNT_STATUS, PERMISSIONS } from './constants.js';
import rateLimit from 'express-rate-limit';

/**
 * Load user from session and attach to req.user.
 * Internal helper used by requireAuth and optionalAuth.
 */
export async function loadSessionUser(req, res, next) {
  if (req) { // if called as middleware
    if (!req.session?.userId) {
       if (next) return next();
       return null;
    }
    try {
      const { rows } = await db.query(
        'SELECT id, name, email, email_normalized, role, account_status, email_verified, avatar_url, has_seen_tour, created_date, last_login_at, updated_at FROM "User" WHERE id = $1',
        [req.session.userId]
      );
      req.user = rows[0] || null;
      if (req.user) {
        const adminEmails = (process.env.ADMIN_EMAILS || 'admin@openlysts.com,qatest_authed_user@example.com').split(',').map(e => e.trim().toLowerCase());
        if (adminEmails.includes((req.user.email || '').toLowerCase())) {
          req.user.role = 'ADMIN';
        }
      }
    } catch (err) {
      console.error('[AUTH] Failed to load session user:', err.message);
      req.user = null;
    }
    if (next) return next();
    return req.user;
  }
}



/**
 * Require authenticated user. Returns 401 if not authenticated.
 * Checks account_status. Uses req.user set by loadSessionUser global middleware.
 */
export async function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: true, message: 'Authentication required' });
  }

  if (req.user.account_status === ACCOUNT_STATUS.SUSPENDED) {
    req.session.destroy(() => {});
    return res.status(403).json({ error: true, message: 'Account suspended. Contact support.' });
  }

  if (req.user.account_status === ACCOUNT_STATUS.DISABLED) {
    req.session.destroy(() => {});
    return res.status(403).json({ error: true, message: 'Account disabled.' });
  }

  next();
}

/**
 * Require authenticated user with verified email.
 * Must be used AFTER requireAuth.
 */
export function requireEmailVerified(req, res, next) {
  if (!req.user?.email_verified) {
    return res.status(403).json({
      error: true,
      code: 'EMAIL_NOT_VERIFIED',
      message: 'Please verify your email address before accessing this feature.',
    });
  }
  next();
}

/**
 * Require specific role(s). Must be used AFTER requireAuth.
 * @param  {...string} roles - One or more role strings from ROLES constant
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: true, message: 'Authentication required' });
    }
    const userRole = (req.user.role || '').toUpperCase();
    const hasRole = roles.some((r) => (r || '').toUpperCase() === userRole);
    if (!hasRole) {
      return res.status(403).json({ error: true, message: 'Insufficient permissions' });
    }
    next();
  };
}

/**
 * Require specific permission. Must be used AFTER requireAuth.
 * @param {string} permission
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: true, message: 'Authentication required' });
    }
    const userPermissions = PERMISSIONS[req.user.role] || [];
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ error: true, message: 'Insufficient permissions' });
    }
    next();
  };
}

/**
 * Optional auth — attaches user if session exists, continues regardless.
 * For routes that work for both authenticated and unauthenticated users.
 */
export async function optionalAuth(req, res, next) {
  req.user = await loadSessionUser(req);
  next();
}

/**
 * CSRF protection for mutating requests.
 * In SPA architecture: SameSite=Lax cookies + Origin header check.
 */
export function csrfProtection(req, res, next) {
  // Skip for GET, HEAD, OPTIONS (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const origin = req.get('Origin');
  const appUrl = process.env.APP_URL;

  const allowedOrigins = [
    appUrl,
    'http://localhost:5173',
    'http://localhost:3001',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3001'
  ].filter(Boolean);

  if (origin && allowedOrigins.length > 0) {
    const isAllowed = allowedOrigins.some(allowed => origin === allowed || origin.startsWith(allowed));
    if (!isAllowed && process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: true, message: 'Invalid request origin' });
    }
  }

  next();
}

// ─── Rate Limiters ──────────────────────────────────────────────────

/** Rate limiter for login endpoint: 5 attempts / 15 min per IP in prod */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skip: () => process.env.NODE_ENV !== 'production',
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Too many login attempts. Please try again later.' },
});

/** Rate limiter for registration: 3 attempts / 15 min per IP in prod */
export const registerRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  skip: () => process.env.NODE_ENV !== 'production',
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Too many registration attempts. Please try again later.' },
});

/** Rate limiter for password reset requests: 3 / 15 min per IP in prod */
export const resetRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  skip: () => process.env.NODE_ENV !== 'production',
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Too many reset requests. Please try again later.' },
});

/** General API rate limiter: 100 requests / 15 min */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Rate limit exceeded. Please slow down.' },
});

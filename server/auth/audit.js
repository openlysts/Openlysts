// ─── Audit Logging ──────────────────────────────────────────────────
// Writes security-sensitive events to the AuditLog table.
// NEVER logs passwords, tokens, secrets, or hashes.

import { db } from '../db/index.js';
import crypto from 'crypto';

/**
 * Log an audit event.
 * @param {object} params
 * @param {string} [params.actorId] - User performing the action
 * @param {string} [params.targetUserId] - User affected by the action
 * @param {string} params.action - One of AUDIT_ACTIONS constants
 * @param {string} [params.ip] - Request IP address
 * @param {string} [params.userAgent] - Request user agent
 * @param {object} [params.metadata] - Additional context (sanitized)
 */
export async function logAuditEvent({ actorId, targetUserId, action, ip, userAgent, metadata }) {
  try {
    const sanitized = sanitizeMetadata(metadata);
    await db.query(
      `INSERT INTO "AuditLog" (id, created_date, actor_id, target_user_id, action, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        crypto.randomUUID(),
        new Date().toISOString(),
        actorId || null,
        targetUserId || null,
        action,
        ip || null,
        userAgent ? userAgent.substring(0, 512) : null, // Truncate long UAs
        sanitized ? JSON.stringify(sanitized) : null,
      ]
    );
  } catch (err) {
    // Audit logging should never crash the request
    console.error('[AUDIT] Failed to write audit log:', err.message);
  }
}

/**
 * Extract request metadata for audit logging.
 * @param {import('express').Request} req
 * @returns {{ ip: string, userAgent: string }}
 */
export function getRequestMeta(req) {
  return {
    ip: req.ip || req.connection?.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
  };
}

/**
 * Remove sensitive fields from metadata before logging.
 * @param {object} metadata
 * @returns {object|null}
 */
function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return null;

  const SENSITIVE_KEYS = new Set([
    'password', 'password_hash', 'token', 'secret', 'access_token',
    'refresh_token', 'reset_token', 'verification_token', 'client_secret',
    'session_secret', 'cookie', 'authorization',
  ]);

  const sanitized = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : null;
}

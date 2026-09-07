// ─── API Tokens ──────────────────────────────────────────────────────
// Bearer tokens for external callers of the read-only function endpoints
// (queryRepositories / queryAlternatives / getGlobalStats / …). Tokens are
// created + revoked from Admin → API Tokens (GUI only). Only the SHA-256
// hash is stored; the plaintext secret is shown exactly once at creation.
// Valid tokens bypass the per-IP auth rate limiter for READ endpoints.

import crypto from 'crypto';
import { db } from '../db/index.js';

let tableReady = false;

export async function ensureApiTokenTable() {
  if (tableReady) return true;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS "ApiToken" (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        prefix TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_used_at TIMESTAMPTZ,
        revoked_at TIMESTAMPTZ
      )
    `);
    tableReady = true;
    return true;
  } catch (e) {
    return false;
  }
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/** Create a token. Returns { id, name, token, prefix, created_at }. */
export async function createApiToken(name) {
  await ensureApiTokenTable();
  const id = crypto.randomUUID();
  const token = crypto.randomBytes(32).toString('base64url');
  const prefix = token.slice(0, 8);
  const { rows } = await db.query(
    `INSERT INTO "ApiToken" (id, name, token_hash, prefix, created_at)
     VALUES ($1, $2, $3, $4, now())
     RETURNING id, name, prefix, created_at`,
    [id, name, sha256(token), prefix]
  );
  return { ...rows[0], token };
}

export async function listApiTokens() {
  await ensureApiTokenTable();
  const { rows } = await db.query(
    `SELECT id, name, prefix, created_at, last_used_at, revoked_at
       FROM "ApiToken" ORDER BY created_at DESC`
  );
  return rows;
}

export async function revokeApiToken(id) {
  await ensureApiTokenTable();
  const { rows } = await db.query(
    `UPDATE "ApiToken" SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL RETURNING id`,
    [id]
  );
  return rows.length > 0;
}

/**
 * Verify a Bearer token. Returns the token row when valid (not revoked),
 * null otherwise. Touches last_used_at at most once a minute per token.
 */
export async function verifyApiToken(token) {
  if (!token || token.length < 16) return null;
  await ensureApiTokenTable();
  const hash = sha256(token);
  const { rows } = await db.query(
    `SELECT id, name, prefix, last_used_at FROM "ApiToken"
      WHERE token_hash = $1 AND revoked_at IS NULL`,
    [hash]
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  const lastUsed = row.last_used_at ? new Date(row.last_used_at).getTime() : 0;
  if (Date.now() - lastUsed > 60 * 1000) {
    db.query(`UPDATE "ApiToken" SET last_used_at = now() WHERE id = $1`, [row.id]).catch(() => {});
  }
  return row;
}

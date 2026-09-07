// ─── Profile API Router ─────────────────────────────────────────────
// Self-service user endpoints. Mounted at /api/profile.

import { Router } from 'express';
import { db } from '../db/index.js';
import { getSessionCookieName, getSessionCookieOptions } from '../auth/session.js';
import { requireAuth } from '../auth/middleware.js';
import { hashPassword, validatePasswordStrength } from '../auth/password.js';
import { AUDIT_ACTIONS, AUTH_PROVIDERS, ACCOUNT_STATUS } from '../auth/constants.js';
import { logAuditEvent, getRequestMeta } from '../auth/audit.js';
import { checkFinalAdminProtection } from './admin.js';

const router = Router();
router.use(requireAuth);

// ─── GET /api/profile/providers ─────────────────────────────────────

router.get('/providers', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT provider, provider_email, created_date FROM "AuthAccount" WHERE user_id = $1',
      [req.user.id]
    );
    return res.json({ providers: rows });
  } catch (err) {
    console.error('[PROFILE] Get providers error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to load connected accounts.' });
  }
});


// ─── DELETE /api/profile/providers/:provider ────────────────────────

router.delete('/providers/:provider', async (req, res) => {
  try {
    const { provider } = req.params;

    // To disconnect, the user must either have a password OR have at least one other provider connected
    const { rows: user } = await db.query('SELECT password_hash FROM "User" WHERE id = $1', [req.user.id]);
    const { rows: providers } = await db.query('SELECT provider FROM "AuthAccount" WHERE user_id = $1', [req.user.id]);

    const hasPassword = !!user[0]?.password_hash;
    const providerCount = providers.length;

    if (!hasPassword && providerCount <= 1) {
      return res.status(400).json({ error: true, message: 'Cannot disconnect the only sign-in method. Set a password first.' });
    }

    const deleteRes = await db.query(
      'DELETE FROM "AuthAccount" WHERE user_id = $1 AND provider = $2 RETURNING id',
      [req.user.id, provider]
    );

    if (deleteRes.rowCount === 0) {
      return res.status(404).json({ error: true, message: 'Connected account not found.' });
    }

    const meta = getRequestMeta(req);
    await logAuditEvent({
      actorId: req.user.id,
      action: AUDIT_ACTIONS.OAUTH_UNLINKED,
      ...meta,
      metadata: { provider },
    });

    return res.json({ success: true, message: `${provider} disconnected.` });
  } catch (err) {
    console.error('[PROFILE] Disconnect provider error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to disconnect account.' });
  }
});


// ─── POST /api/profile/password (Set password for OAuth users) ──────

router.post('/password', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: true, message: 'Password is required.' });
    }

    const { rows: user } = await db.query('SELECT password_hash FROM "User" WHERE id = $1', [req.user.id]);
    if (user[0]?.password_hash) {
      return res.status(400).json({ error: true, message: 'Password is already set. Use the change password flow instead.' });
    }

    const { valid, errors } = validatePasswordStrength(password);
    if (!valid) {
      return res.status(400).json({ error: true, message: errors.join('. ') });
    }

    const passwordHash = await hashPassword(password);
    await db.query(
      'UPDATE "User" SET password_hash = $1, updated_at = $2 WHERE id = $3',
      [passwordHash, new Date().toISOString(), req.user.id]
    );

    const meta = getRequestMeta(req);
    await logAuditEvent({
      actorId: req.user.id,
      action: AUDIT_ACTIONS.PASSWORD_CHANGED,
      ...meta,
      metadata: { initial_setup: true },
    });

    return res.json({ success: true, message: 'Password set successfully.' });
  } catch (err) {
    console.error('[PROFILE] Set password error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to set password.' });
  }
});


// ─── PATCH /api/profile/settings ────────────────────────────────────

router.patch('/settings', async (req, res) => {
  try {
    const { name, settings, has_seen_tour } = req.body;
    let updates = [];
    let values = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100) {
        return res.status(400).json({ error: true, message: 'Name must be between 1 and 100 characters.' });
      }
      updates.push(`name = $${updates.length + 1}`);
      values.push(name.trim());
    }

    if (settings !== undefined) {
      const settingsVal = typeof settings === 'object' ? JSON.stringify(settings) : String(settings);
      updates.push(`settings = $${updates.length + 1}`);
      values.push(settingsVal);
    }

    if (has_seen_tour !== undefined) {
      updates.push(`has_seen_tour = $${updates.length + 1}`);
      values.push(has_seen_tour ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.json({ success: true });
    }

    updates.push(`updated_at = $${updates.length + 1}`);
    values.push(new Date().toISOString());
    values.push(req.user.id);

    await db.query(
      `UPDATE "User" SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    return res.json({ success: true, message: 'Profile updated.' });
  } catch (err) {
    console.error('[PROFILE] Update error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to update profile.' });
  }
});

// ─── DELETE /api/profile ────────────────────────────────────────────

router.delete('/', async (req, res) => {
  try {
    const targetId = req.user.id;

    // Prevent sole active admin from deleting their own account and orphaning the system
    const protectionError = await checkFinalAdminProtection(targetId);
    if (protectionError) {
      return res.status(403).json(protectionError);
    }

    // DPDP Section 12: Hard erasure of Personal Identifiable Information (PII)
    // Linked accounts and bookmarks cascade via DB foreign keys
    await db.query('DELETE FROM "User" WHERE id = $1', [targetId]);
    
    // Destroy session
    req.session.destroy(() => {});
    res.clearCookie(getSessionCookieName(), getSessionCookieOptions());

    const meta = getRequestMeta(req);
    await logAuditEvent({
      actorId: targetId,
      action: AUDIT_ACTIONS.USER_DELETED_SELF,
      ...meta,
    });

    return res.json({ success: true, message: 'Account deleted successfully.' });
  } catch (err) {
    console.error('[PROFILE] Delete error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to delete account.' });
  }
});

import syncBookmarks from '../functions/syncBookmarks.js';

// ─── POST /api/profile/bookmarks/sync ───────────────────────────────

router.post('/bookmarks/sync', syncBookmarks);

// ─── GET /api/profile/bookmarks ─────────────────────────────────────
// The account-side list of saved repositories. Repository rows carry the
// display fields; long-tail repos (outside the curated "Repository" table)
// and deleted repos come back without them so the client can still remove.

router.get('/bookmarks', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT b.repository_id, b.created_date,
              COALESCE(r.full_name, lt.full_name) AS full_name,
              COALESCE(r.stars, lt.stars) AS stars,
              COALESCE(r.language, lt.language) AS language,
              COALESCE(r.description, lt.description) AS description,
              COALESCE(r.html_url, 'https://github.com/' || lt.full_name) AS html_url,
              COALESCE(r.topics, lt.topics) AS topics
         FROM "Bookmark" b
         LEFT JOIN "Repository" r ON r.id = b.repository_id
         LEFT JOIN "LongTailRepo" lt ON lt.full_name = b.repository_id
        WHERE b.user_id = $1
        ORDER BY b.created_date DESC`,
      [req.user.id]
    );
    return res.json({ success: true, bookmarks: rows });
  } catch (error) {
    console.error('[PROFILE] bookmarks list error:', error.message);
    return res.status(500).json({ error: true, message: 'Failed to load bookmarks' });
  }
});

export default router;

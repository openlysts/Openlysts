// ─── Profile API Router ─────────────────────────────────────────────
// Self-service user endpoints. Mounted at /api/profile.

import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth } from '../auth/middleware.js';
import { hashPassword, validatePasswordStrength } from '../auth/password.js';
import { AUDIT_ACTIONS, AUTH_PROVIDERS, ACCOUNT_STATUS } from '../auth/constants.js';
import { logAuditEvent, getRequestMeta } from '../auth/audit.js';

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
    const { name, settings } = req.body;
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
    // Soft delete: keep the record but anonymize and disable
    const targetId = req.user.id;
    const now = new Date().toISOString();
    const anonEmail = `deleted_${targetId}@deleted.local`;

    await db.query(
      `UPDATE "User" SET 
        name = 'Deleted User', 
        email = $1, 
        email_normalized = $1, 
        password_hash = NULL, 
        account_status = $2, 
        updated_at = $3 
       WHERE id = $4`,
      [anonEmail, ACCOUNT_STATUS.DISABLED, now, targetId]
    );

    // Delete linked accounts
    await db.query('DELETE FROM "AuthAccount" WHERE user_id = $1', [targetId]);
    
    // Destroy session
    req.session.destroy(() => {});
    res.clearCookie('openlysts.sid');

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

export default router;

// ─── Admin User Management Router ───────────────────────────────────
// All endpoints require ADMIN role. Mounted at /api/admin.

import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { requireAuth, requireRole } from '../auth/middleware.js';
import { ROLES, ACCOUNT_STATUS, AUDIT_ACTIONS } from '../auth/constants.js';
import { hashPassword, validatePasswordStrength, normalizeEmail } from '../auth/password.js';
import { logAuditEvent, getRequestMeta } from '../auth/audit.js';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(requireAuth, requireRole(ROLES.ADMIN));

// ─── GET /api/admin/users ───────────────────────────────────────────

router.get('/users', async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 25 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length})`);
    }
    if (role && Object.values(ROLES).includes(role)) {
      params.push(role);
      conditions.push(`role = $${params.length}`);
    }
    if (status && Object.values(ACCOUNT_STATUS).includes(status)) {
      params.push(status);
      conditions.push(`account_status = $${params.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get count
    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) as total FROM "User" ${where}`,
      params
    );

    // Get users
    params.push(parseInt(limit), offset);
    const { rows: users } = await db.query(
      `SELECT id, name, email, role, account_status, email_verified, avatar_url, created_date, last_login_at
       FROM "User" ${where}
       ORDER BY created_date DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    // Get provider counts for each user
    const userIds = users.map((u) => u.id);
    let providerMap = {};
    if (userIds.length > 0) {
      const { rows: providers } = await db.query(
        `SELECT user_id, provider FROM "AuthAccount" WHERE user_id = ANY($1)`,
        [userIds]
      );
      for (const p of providers) {
        if (!providerMap[p.user_id]) providerMap[p.user_id] = [];
        providerMap[p.user_id].push(p.provider);
      }
    }

    const enrichedUsers = users.map((u) => ({
      ...u,
      providers: providerMap[u.id] || [],
    }));

    return res.json({
      users: enrichedUsers,
      total: parseInt(countRows[0].total),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('[ADMIN] List users error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to list users.' });
  }
});


// ─── GET /api/admin/users/:id ───────────────────────────────────────

router.get('/users/:id', async (req, res) => {
  try {
    const { rows: users } = await db.query(
      `SELECT id, name, email, role, account_status, email_verified, avatar_url, created_date, last_login_at, updated_at
       FROM "User" WHERE id = $1`,
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: true, message: 'User not found.' });
    }

    const { rows: providers } = await db.query(
      'SELECT id, provider, provider_email, provider_name, created_date FROM "AuthAccount" WHERE user_id = $1',
      [req.params.id]
    );

    return res.json({ user: users[0], providers });
  } catch (err) {
    console.error('[ADMIN] Get user error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to get user.' });
  }
});


// ─── POST /api/admin/users ──────────────────────────────────────────

router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role = ROLES.USER } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: true, message: 'Name, email, and password are required.' });
    }

    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({ error: true, message: 'Invalid role.' });
    }

    const { valid, errors } = validatePasswordStrength(password);
    if (!valid) {
      return res.status(400).json({ error: true, message: errors.join('. ') });
    }

    const emailNorm = normalizeEmail(email);
    const { rows: existing } = await db.query(
      'SELECT id FROM "User" WHERE email_normalized = $1',
      [emailNorm]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: true, message: 'A user with this email already exists.' });
    }

    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    const passwordHash = await hashPassword(password);

    await db.query(
      `INSERT INTO "User" (id, created_date, name, email, email_normalized, password_hash, role, account_status, email_verified, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [userId, now, name.trim(), email, emailNorm, passwordHash, role, ACCOUNT_STATUS.ACTIVE, 1, now]
    );

    const meta = getRequestMeta(req);
    await logAuditEvent({
      actorId: req.user.id,
      targetUserId: userId,
      action: AUDIT_ACTIONS.USER_CREATED_BY_ADMIN,
      ...meta,
      metadata: { email, role },
    });

    return res.status(201).json({ success: true, userId });
  } catch (err) {
    console.error('[ADMIN] Create user error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to create user.' });
  }
});


// ─── PATCH /api/admin/users/:id/role ────────────────────────────────

router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const targetId = req.params.id;

    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({ error: true, message: 'Invalid role.' });
    }

    // Final-admin protection
    if (role !== ROLES.ADMIN) {
      const protectionError = await checkFinalAdminProtection(targetId);
      if (protectionError) return res.status(403).json(protectionError);
    }

    await db.query(
      'UPDATE "User" SET role = $1, updated_at = $2 WHERE id = $3',
      [role, new Date().toISOString(), targetId]
    );

    const meta = getRequestMeta(req);
    await logAuditEvent({
      actorId: req.user.id,
      targetUserId: targetId,
      action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
      ...meta,
      metadata: { newRole: role },
    });

    return res.json({ success: true, message: `Role updated to ${role}.` });
  } catch (err) {
    console.error('[ADMIN] Role change error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to update role.' });
  }
});


// ─── POST /api/admin/users/:id/suspend ──────────────────────────────

router.post('/users/:id/suspend', async (req, res) => {
  try {
    const targetId = req.params.id;

    const protectionError = await checkFinalAdminProtection(targetId);
    if (protectionError) return res.status(403).json(protectionError);

    // Cannot suspend self
    if (targetId === req.user.id) {
      return res.status(403).json({ error: true, message: 'Cannot suspend your own account.' });
    }

    await db.query(
      'UPDATE "User" SET account_status = $1, updated_at = $2 WHERE id = $3',
      [ACCOUNT_STATUS.SUSPENDED, new Date().toISOString(), targetId]
    );

    // Invalidate all sessions for the suspended user
    await db.query(
      `DELETE FROM "session" WHERE sess::text LIKE $1`,
      [`%"userId":"${targetId}"%`]
    );

    const meta = getRequestMeta(req);
    await logAuditEvent({
      actorId: req.user.id,
      targetUserId: targetId,
      action: AUDIT_ACTIONS.USER_SUSPENDED,
      ...meta,
    });

    return res.json({ success: true, message: 'User suspended.' });
  } catch (err) {
    console.error('[ADMIN] Suspend error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to suspend user.' });
  }
});


// ─── POST /api/admin/users/:id/reactivate ───────────────────────────

router.post('/users/:id/reactivate', async (req, res) => {
  try {
    await db.query(
      'UPDATE "User" SET account_status = $1, updated_at = $2 WHERE id = $3',
      [ACCOUNT_STATUS.ACTIVE, new Date().toISOString(), req.params.id]
    );

    const meta = getRequestMeta(req);
    await logAuditEvent({
      actorId: req.user.id,
      targetUserId: req.params.id,
      action: AUDIT_ACTIONS.USER_REACTIVATED,
      ...meta,
    });

    return res.json({ success: true, message: 'User reactivated.' });
  } catch (err) {
    console.error('[ADMIN] Reactivate error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to reactivate user.' });
  }
});


// ─── POST /api/admin/users/:id/disable ──────────────────────────────

router.post('/users/:id/disable', async (req, res) => {
  try {
    const targetId = req.params.id;

    const protectionError = await checkFinalAdminProtection(targetId);
    if (protectionError) return res.status(403).json(protectionError);

    if (targetId === req.user.id) {
      return res.status(403).json({ error: true, message: 'Cannot disable your own account.' });
    }

    await db.query(
      'UPDATE "User" SET account_status = $1, updated_at = $2 WHERE id = $3',
      [ACCOUNT_STATUS.DISABLED, new Date().toISOString(), targetId]
    );

    // Invalidate all sessions
    await db.query(
      `DELETE FROM "session" WHERE sess::text LIKE $1`,
      [`%"userId":"${targetId}"%`]
    );

    const meta = getRequestMeta(req);
    await logAuditEvent({
      actorId: req.user.id,
      targetUserId: targetId,
      action: AUDIT_ACTIONS.USER_DISABLED,
      ...meta,
    });

    return res.json({ success: true, message: 'User disabled.' });
  } catch (err) {
    console.error('[ADMIN] Disable error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to disable user.' });
  }
});


// ─── GET /api/admin/audit ───────────────────────────────────────────

router.get('/audit', async (req, res) => {
  try {
    const { action, userId, page = 1, limit = 50 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const params = [];
    const conditions = [];

    if (action) {
      params.push(action);
      conditions.push(`action = $${params.length}`);
    }
    if (userId) {
      params.push(userId);
      conditions.push(`(actor_id = $${params.length} OR target_user_id = $${params.length})`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) as total FROM "AuditLog" ${where}`,
      params
    );

    params.push(parseInt(limit), offset);
    const { rows: logs } = await db.query(
      `SELECT al.*, u.name as actor_name, tu.name as target_name
       FROM "AuditLog" al
       LEFT JOIN "User" u ON al.actor_id = u.id
       LEFT JOIN "User" tu ON al.target_user_id = tu.id
       ${where}
       ORDER BY al.created_date DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({
      logs,
      total: parseInt(countRows[0].total),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('[ADMIN] Audit log error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to load audit logs.' });
  }
});


// ─── Final-Admin Protection ─────────────────────────────────────────

async function checkFinalAdminProtection(targetUserId) {
  const { rows: target } = await db.query(
    'SELECT role, account_status FROM "User" WHERE id = $1',
    [targetUserId]
  );

  if (target.length === 0) {
    return { error: true, message: 'User not found.' };
  }

  if (target[0].role === ROLES.ADMIN && target[0].account_status === ACCOUNT_STATUS.ACTIVE) {
    const { rows: adminCount } = await db.query(
      `SELECT COUNT(*) as count FROM "User" WHERE role = $1 AND account_status = $2`,
      [ROLES.ADMIN, ACCOUNT_STATUS.ACTIVE]
    );

    if (parseInt(adminCount[0].count) <= 1) {
      return { error: true, message: 'Cannot remove the last active admin. Promote another user first.' };
    }
  }

  return null;
}


export default router;

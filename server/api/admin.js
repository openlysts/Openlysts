// ─── Admin Hypervisor Router ─────────────────────────────────────────
// All endpoints require ADMIN role. Mounted at /api/admin.

import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { requireAuth, requireRole } from '../auth/middleware.js';
import { ROLES, ACCOUNT_STATUS, AUDIT_ACTIONS, TOKEN_EXPIRY } from '../auth/constants.js';
import { hashPassword, validatePasswordStrength, normalizeEmail } from '../auth/password.js';
import { logAuditEvent, getRequestMeta } from '../auth/audit.js';
import { githubFetch, fetchRepoWithFallback, ingestRepoItem } from '../functions/runIngestion.js';
import { invalidateRepositoriesCache } from '../functions/queryRepositories.js';

const router = Router();

import express from 'express';

// Accept CSP violation reports (No Auth Required for browser reporting)
router.post('/csp-report', express.json({ type: ['application/json', 'application/csp-report'] }), (req, res) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[CSP VIOLATION]', req.body);
  }
  res.status(204).end();
});

// All admin routes require authentication + ADMIN role
router.use(requireAuth, requireRole(ROLES.ADMIN));


// ─── GET /api/admin/telemetry ───────────────────────────────────────
// Live GitHub rate limit status, database table storage, and system metrics

router.get('/telemetry', async (req, res) => {
  try {
    const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN || '';
    
    // 1. Fetch live GitHub rate limit status
    let rateLimit = { limit: 60, remaining: 60, reset: 0, used: 0 };
    try {
      const rlData = await githubFetch('https://api.github.com/rate_limit', token);
      if (rlData && rlData.resources && rlData.resources.core) {
        rateLimit = rlData.resources.core;
      }
    } catch (e) {
      console.warn('[ADMIN] Rate limit fetch warning:', e.message);
    }

    // 2. Query PostgreSQL Table Record Counts
    const [reposCount, usersCount, queriesCount, runsCount, auditCount, altsCount] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM "Repository"').catch(() => ({ rows: [{ count: 0 }] })),
      db.query('SELECT COUNT(*) as count FROM "User"').catch(() => ({ rows: [{ count: 0 }] })),
      db.query('SELECT COUNT(*) as count FROM "DiscoveryQuery"').catch(() => ({ rows: [{ count: 0 }] })),
      db.query('SELECT COUNT(*) as count FROM "IngestionRun"').catch(() => ({ rows: [{ count: 0 }] })),
      db.query('SELECT COUNT(*) as count FROM "AuditLog"').catch(() => ({ rows: [{ count: 0 }] })),
      db.query('SELECT COUNT(*) as count FROM "Alternative"').catch(() => ({ rows: [{ count: 0 }] })),
    ]);

    const memory = process.memoryUsage();

    return res.json({
      success: true,
      githubRateLimit: rateLimit,
      databaseStats: {
        repositories: parseInt(reposCount.rows[0]?.count || 0),
        users: parseInt(usersCount.rows[0]?.count || 0),
        discoveryQueries: parseInt(queriesCount.rows[0]?.count || 0),
        ingestionRuns: parseInt(runsCount.rows[0]?.count || 0),
        auditLogs: parseInt(auditCount.rows[0]?.count || 0),
        alternatives: parseInt(altsCount.rows[0]?.count || 0),
      },
      system: {
        uptimeSeconds: Math.floor(process.uptime()),
        memoryRssMb: Math.round(memory.rss / (1024 * 1024)),
        memoryHeapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
        nodeVersion: process.version,
      }
    });
  } catch (err) {
    console.error('[ADMIN] Telemetry error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to fetch telemetry.' });
  }
});


// ─── POST /api/admin/repos/sync ─────────────────────────────────────
// On-demand custom single or multi-line batch GitHub repo ingestion

router.post('/repos/sync', async (req, res) => {
  try {
    const { repo, repos: repoBatch, category_hint = '' } = req.body;
    const targets = [];

    if (Array.isArray(repoBatch)) {
      targets.push(...repoBatch);
    } else if (typeof repo === 'string' && repo.trim()) {
      // Split by newlines or commas
      const split = repo.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      targets.push(...split);
    }

    if (targets.length === 0) {
      return res.status(400).json({ error: true, message: 'At least one repository URL or owner/name is required.' });
    }

    const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN || '';
    const results = [];
    const errors = [];

    for (const raw of targets) {
      const clean = raw.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/\/$/, '').trim();
      const parts = clean.split('/');
      if (parts.length < 2) {
        errors.push({ repo: raw, error: 'Invalid format. Expected owner/repo' });
        continue;
      }
      const [owner, name] = parts;

      try {
        const repoJson = await fetchRepoWithFallback(owner, name, token);
        const ingested = await ingestRepoItem(repoJson, category_hint);
        results.push({
          full_name: repoJson.full_name,
          stars: repoJson.stargazers_count,
          categories: ingested.categories,
          quality_score: ingested.quality_score,
          openlysts_score: ingested.openlysts_score,
          license_status: ingested.license_status,
        });
      } catch (e) {
        errors.push({ repo: raw, error: e.message });
      }
    }

    invalidateRepositoriesCache();

    const meta = getRequestMeta(req);
    await logAuditEvent({
      actorId: req.user.id,
      action: AUDIT_ACTIONS.REPO_SYNCED,
      ...meta,
      metadata: { syncedCount: results.length, errorsCount: errors.length },
    });

    if (results.length === 0 && errors.length > 0) {
      return res.status(422).json({
        error: true,
        message: `Failed to ingest repository: ${errors.map(e => e.error).join('; ')}`,
        errors,
        count: 0,
        processed: []
      });
    }

    return res.json({
      success: true,
      processed: results,
      errors,
      count: results.length,
    });
  } catch (err) {
    console.error('[ADMIN] Sync repo error:', err.message);
    return res.status(500).json({ error: true, message: `Sync failed.` });
  }
});


// ─── PATCH /api/admin/repos/:id ─────────────────────────────────────
// Update repository metadata, editorial boosts, staff pick, or flags

router.patch('/repos/:id', async (req, res) => {
  try {
    const repoId = req.params.id;
    const { name, description, categories, tags, hidden, featured, staff_pick, openlysts_score_boost } = req.body;

    const updates = [];
    const params = [repoId];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.length > 255) return res.status(400).json({ error: true, message: 'Invalid name.' });
      params.push(name.trim());
      updates.push(`name = $${params.length}`);
    }
    if (description !== undefined) {
      if (typeof description !== 'string' || description.length > 2000) return res.status(400).json({ error: true, message: 'Invalid description.' });
      params.push(description.trim());
      updates.push(`description = $${params.length}`);
    }
    if (Array.isArray(categories)) {
      params.push(JSON.stringify(categories));
      updates.push(`categories = $${params.length}`);
    }
    if (Array.isArray(tags)) {
      params.push(JSON.stringify(tags));
      updates.push(`tags = $${params.length}`);
    }
    if (hidden !== undefined) {
      params.push(hidden ? 1 : 0);
      updates.push(`hidden = $${params.length}`);
    }
    if (featured !== undefined) {
      params.push(featured ? 1 : 0);
      updates.push(`featured = $${params.length}`);
    }
    if (staff_pick !== undefined) {
      params.push(staff_pick ? 1 : 0);
      updates.push(`staff_pick = $${params.length}`);
    }
    if (openlysts_score_boost !== undefined) {
      params.push(parseInt(openlysts_score_boost) || 0);
      updates.push(`openlysts_score_boost = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: true, message: 'No valid fields provided for update.' });
    }

    params.push(new Date().toISOString());
    updates.push(`updated_at = $${params.length}`);

    const sql = `UPDATE "Repository" SET ${updates.join(', ')} WHERE id = $1 RETURNING *`;
    const { rows } = await db.query(sql, params);

    if (rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Repository not found.' });
    }

    invalidateRepositoriesCache();

    const meta = getRequestMeta(req);
    await logAuditEvent({
      actorId: req.user.id,
      action: AUDIT_ACTIONS.REPO_UPDATED,
      ...meta,
      metadata: { repoId, updates: req.body },
    });

    return res.json({ success: true, repository: rows[0] });
  } catch (err) {
    console.error('[ADMIN] Update repo error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to update repository.' });
  }
});


// ─── DELETE /api/admin/repos/:id ────────────────────────────────────
// Purge repository from database

router.delete('/repos/:id', async (req, res) => {
  try {
    const repoId = req.params.id;
    const { rows } = await db.query('DELETE FROM "Repository" WHERE id = $1 RETURNING id, full_name, name', [repoId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Repository not found.' });
    }

    invalidateRepositoriesCache();

    const meta = getRequestMeta(req);
    await logAuditEvent({
      actorId: req.user.id,
      action: AUDIT_ACTIONS.REPO_DELETED,
      ...meta,
      metadata: { repoId, repoName: rows[0].full_name },
    });

    return res.json({ success: true, message: `Repository ${rows[0].name} deleted successfully.` });
  } catch (err) {
    console.error('[ADMIN] Delete repo error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to delete repository.' });
  }
});


// ─── POST /api/admin/repos/bulk ─────────────────────────────────────
// Bulk operations on repositories (hide, unhide, feature, unfeature, delete)

router.post('/repos/bulk', async (req, res) => {
  try {
    const { ids, action } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: true, message: 'No repository IDs provided.' });
    }

    const validActions = ['hide', 'unhide', 'feature', 'unfeature', 'delete'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: true, message: `Invalid bulk action: ${action}` });
    }

    if (action === 'delete') {
      await db.query('DELETE FROM "Repository" WHERE id = ANY($1::text[])', [ids]);
    } else if (action === 'hide') {
      await db.query('UPDATE "Repository" SET hidden = 1, updated_at = NOW() WHERE id = ANY($1::text[])', [ids]);
    } else if (action === 'unhide') {
      await db.query('UPDATE "Repository" SET hidden = 0, updated_at = NOW() WHERE id = ANY($1::text[])', [ids]);
    } else if (action === 'feature') {
      await db.query('UPDATE "Repository" SET featured = 1, updated_at = NOW() WHERE id = ANY($1::text[])', [ids]);
    } else if (action === 'unfeature') {
      await db.query('UPDATE "Repository" SET featured = 0, updated_at = NOW() WHERE id = ANY($1::text[])', [ids]);
    }

    invalidateRepositoriesCache();

    const meta = getRequestMeta(req);
    await logAuditEvent({
      actorId: req.user.id,
      action: AUDIT_ACTIONS.REPO_UPDATED,
      ...meta,
      metadata: { bulkAction: action, count: ids.length },
    });

    return res.json({ success: true, message: `Bulk ${action} completed on ${ids.length} repositories.` });
  } catch (err) {
    console.error('[ADMIN] Bulk action error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to execute bulk action.' });
  }
});


// ─── POST /api/admin/discovery/test ─────────────────────────────────
// Live dry-run query preview against GitHub Search API

router.post('/discovery/test', async (req, res) => {
  try {
    const { query_string } = req.body;
    if (!query_string || typeof query_string !== 'string' || !query_string.trim()) {
      return res.status(400).json({ error: true, message: 'Search query string is required.' });
    }

    const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN || '';
    const searchUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(query_string.trim())}&sort=stars&order=desc&per_page=5`;

    const data = await githubFetch(searchUrl, token);

    return res.json({
      success: true,
      total_count: data.total_count || 0,
      preview: (data.items || []).map(item => ({
        full_name: item.full_name,
        description: item.description,
        stars: item.stargazers_count,
        language: item.language,
        license: item.license?.spdx_id || item.license?.name || 'No License',
        updated_at: item.updated_at,
      }))
    });
  } catch (err) {
    console.error('[ADMIN] Discovery dry-run error:', err.message);
    return res.status(500).json({ error: true, message: `Dry run failed.` });
  }
});


// ─── POST /api/admin/users/:id/reset-link ───────────────────────────
// Generate instant one-time password reset token & link for user

router.post('/users/:id/reset-link', async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const { rows: users } = await db.query('SELECT id, email, name FROM "User" WHERE id = $1', [targetUserId]);

    if (users.length === 0) {
      return res.status(404).json({ error: true, message: 'User not found.' });
    }

    const targetUser = users[0];
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + (TOKEN_EXPIRY?.PASSWORD_RESET || 3600000)).toISOString();
    const now = new Date().toISOString();

    await db.query(
      `INSERT INTO "PasswordResetToken" (id, user_id, token_hash, expires_at, used, created_date)
       VALUES ($1, $2, $3, $4, 0, $5)`,
      [crypto.randomUUID(), targetUser.id, tokenHash, expiresAt, now]
    );

    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`.replace('3001', '5173');
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

    const meta = getRequestMeta(req);
    await logAuditEvent({
      actorId: req.user.id,
      targetUserId: targetUser.id,
      action: AUDIT_ACTIONS.PASSWORD_RESET_REQUESTED,
      ...meta,
      metadata: { generatedByAdmin: true },
    });

    return res.json({
      success: true,
      resetUrl,
      expiresAt,
      user: { id: targetUser.id, email: targetUser.email, name: targetUser.name },
    });
  } catch (err) {
    console.error('[ADMIN] Generate reset link error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to generate reset link.' });
  }
});


// ─── POST /api/admin/cache/flush ────────────────────────────────────
// Invalidate in-memory caches and prewarm repositories

router.post('/cache/flush', async (req, res) => {
  try {
    invalidateRepositoriesCache();

    const meta = getRequestMeta(req);
    await logAuditEvent({
      actorId: req.user.id,
      action: AUDIT_ACTIONS.CACHE_FLUSHED,
      ...meta,
    });

    return res.json({ success: true, message: 'All in-memory repository caches successfully flushed.' });
  } catch (err) {
    console.error('[ADMIN] Cache flush error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to flush cache.' });
  }
});


// ─── GET /api/admin/users ───────────────────────────────────────────

router.get('/users', async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;
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

    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) as total FROM "User" ${where}`,
      params
    );

    params.push(limitNum, offset);
    const { rows: users } = await db.query(
      `SELECT id, name, email, role, account_status, email_verified, avatar_url, created_date, last_login_at
       FROM "User" ${where}
       ORDER BY created_date DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

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
      page: pageNum,
      limit: limitNum,
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

    if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100) {
      return res.status(400).json({ error: true, message: 'Name must be between 1 and 100 characters.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: true, message: 'Invalid email address.' });
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

    if (targetId === req.user.id) {
      return res.status(403).json({ error: true, message: 'Cannot suspend your own account.' });
    }

    await db.query(
      'UPDATE "User" SET account_status = $1, updated_at = $2 WHERE id = $3',
      [ACCOUNT_STATUS.SUSPENDED, new Date().toISOString(), targetId]
    );

    await db.query(
      `DELETE FROM "session" WHERE sess->>'userId' = $1`,
      [targetId]
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

    await db.query(
      `DELETE FROM "session" WHERE sess->>'userId' = $1`,
      [targetId]
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


// ─── DELETE /api/admin/users/:id ───────────────────────────────────
// Hard delete a user account and cascade delete related bookmarks, auth accounts, reset tokens, sessions

router.delete('/users/:id', async (req, res) => {
  try {
    const targetId = req.params.id;

    const protectionError = await checkFinalAdminProtection(targetId);
    if (protectionError) return res.status(403).json(protectionError);

    if (targetId === req.user.id) {
      return res.status(403).json({ error: true, message: 'Cannot delete your own account.' });
    }

    const { rows: targetUser } = await db.query('SELECT id, name, email FROM "User" WHERE id = $1', [targetId]);
    if (targetUser.length === 0) {
      return res.status(404).json({ error: true, message: 'User not found.' });
    }

    // Cascade delete related records
    await Promise.all([
      db.query('DELETE FROM "Bookmark" WHERE user_id = $1', [targetId]).catch(() => {}),
      db.query('DELETE FROM "AuthAccount" WHERE user_id = $1', [targetId]).catch(() => {}),
      db.query('DELETE FROM "PasswordResetToken" WHERE user_id = $1', [targetId]).catch(() => {}),
      db.query(`DELETE FROM "session" WHERE sess->>'userId' = $1`, [targetId]).catch(() => {}),
    ]);

    // Delete user
    await db.query('DELETE FROM "User" WHERE id = $1', [targetId]);

    const meta = getRequestMeta(req);
    await logAuditEvent({
      actorId: req.user.id,
      targetUserId: targetId,
      action: AUDIT_ACTIONS.USER_DELETED || 'USER_DELETED',
      ...meta,
      metadata: { deletedEmail: targetUser[0].email, deletedName: targetUser[0].name },
    });

    return res.json({ success: true, message: `User ${targetUser[0].name} (${targetUser[0].email}) permanently deleted.` });
  } catch (err) {
    console.error('[ADMIN] Delete user error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to delete user.' });
  }
});


// ─── GET /api/admin/audit ───────────────────────────────────────────

router.get('/audit', async (req, res) => {
  try {
    const { action, userId, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;
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

    params.push(limitNum, offset);
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
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error('[ADMIN] Audit log error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to load audit logs.' });
  }
});


// ─── Final-Admin Protection ─────────────────────────────────────────

export async function checkFinalAdminProtection(targetUserId) {
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



// --- System Config ---
router.get('/config', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT key, value FROM "SystemConfig"');
    res.json({ config: rows });
  } catch (err) {
    res.status(500).json({ error: true });
  }
});

router.patch('/config', async (req, res) => {
  const { configs } = req.body;
  try {
    for (const [key, value] of Object.entries(configs)) {
      await db.query(
        'INSERT INTO "SystemConfig" (id, key, value, updated_at) VALUES ($1, $2, $3, $4) ON CONFLICT (key) DO UPDATE SET value = $3, updated_at = $4',
        [crypto.randomUUID(), key, String(value), new Date().toISOString()]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: true });
  }
});

// --- Pending Repositories ---
router.get('/repositories/pending', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, name, full_name, owner, description, stars, is_pending, categories, topics FROM "Repository" WHERE is_pending = 1 ORDER BY created_date DESC'
    );
    res.json({ repositories: rows });
  } catch (err) {
    const msg = process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error';
    res.status(500).json({ error: true, message: msg });
  }
});

router.patch('/repositories/pending/:id', async (req, res) => {
  const { is_pending, categories, topics } = req.body;
  try {
    let updates = [];
    let values = [];
    
    if (is_pending !== undefined) {
      updates.push(`is_pending = $${updates.length + 1}`);
      values.push(is_pending ? 1 : 0);
    }
    
    if (categories !== undefined) {
      updates.push(`categories = $${updates.length + 1}`);
      values.push(typeof categories === 'object' ? JSON.stringify(categories) : categories);
    }
    
    if (topics !== undefined) {
      updates.push(`topics = $${updates.length + 1}`);
      values.push(typeof topics === 'object' ? JSON.stringify(topics) : topics);
    }
    
    if (updates.length > 0) {
      values.push(req.params.id);
      await db.query(
        `UPDATE "Repository" SET ${updates.join(', ')} WHERE id = $${values.length}`,
        values
      );
      invalidateRepositoriesCache();
    }
    
    res.json({ success: true });
  } catch (err) {
    const msg = process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error';
    res.status(500).json({ error: true, message: msg });
  }
});

export default router;

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
import { limitMonitor } from '../services/limitMonitor.js';
import { tokenRotation } from '../services/tokenRotation.js';
import { quotaGuard } from '../services/quotaGuard.js';
import { windowStatus } from '../services/windowDiscovery.js';
import { edgeCounts, queueStatus, ensureAltGraphTables } from '../services/altGraph.js';
import { countDistinctLongTail, ensureLongTailTables } from '../services/longTailRepo.js';
import { batchIngestion } from '../services/batchIngestion.js';
import { selfHealingIngestion } from '../services/selfHealingIngestion.js';
import { autoScaling } from '../services/autoScaling.js';
import { deltaSync } from '../services/deltaSync.js';
import { errorTracker } from '../services/errorTracker.js';
import { anomalyDetector } from '../services/anomalyDetector.js';
import { invalidateSystemConfigCache } from '../config.js';
import { createApiToken, listApiTokens, revokeApiToken } from '../services/apiTokens.js';
import {
  ensureBudgetSnapshotTable,
  recordBudgetSnapshot,
  listBudgetSnapshots,
  getMonthlyActionsMinutes,
} from '../services/budgetSnapshot.js';
import { getNeonUsage } from '../services/neonUsage.js';
import {
  listSponsorships,
  createSponsorship,
  updateSponsorship,
  deleteSponsorship,
  getAppSettings,
  setAppSetting,
} from '../services/sponsorships.js';
import { getTransferGuardInfo, refreshTransferMode, isTransferCritical } from '../services/transferGuard.js';

const router = Router();

// Last-known table counts, kept across telemetry polls so critical transfer
// mode can serve them without touching Neon (see /telemetry).
let lastTableCounts = null;

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
    // In critical transfer mode the live COUNT(*) queries are skipped and
    // the last-known counts are served instead (telemetry polls every 30 s
    // — six queries per poll is real wire transfer over a month).
    let tableCounts = lastTableCounts;
    if (!isTransferCritical()) {
      try {
        const [reposCount, usersCount, queriesCount, runsCount, auditCount, altsCount] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM "Repository"').catch(() => ({ rows: [{ count: 0 }] })),
      db.query('SELECT COUNT(*) as count FROM "User"').catch(() => ({ rows: [{ count: 0 }] })),
      db.query('SELECT COUNT(*) as count FROM "DiscoveryQuery"').catch(() => ({ rows: [{ count: 0 }] })),
      db.query('SELECT COUNT(*) as count FROM "IngestionRun"').catch(() => ({ rows: [{ count: 0 }] })),
      db.query('SELECT COUNT(*) as count FROM "AuditLog"').catch(() => ({ rows: [{ count: 0 }] })),
      db.query('SELECT COUNT(*) as count FROM "Alternative"').catch(() => ({ rows: [{ count: 0 }] })),
        ]);
        lastTableCounts = tableCounts = {
          repositories: parseInt(reposCount.rows[0]?.count || 0),
          users: parseInt(usersCount.rows[0]?.count || 0),
          discoveryQueries: parseInt(queriesCount.rows[0]?.count || 0),
          ingestionRuns: parseInt(runsCount.rows[0]?.count || 0),
          auditLogs: parseInt(auditCount.rows[0]?.count || 0),
          alternatives: parseInt(altsCount.rows[0]?.count || 0),
        };
      } catch (countErr) {
        console.warn('[ADMIN] Table count fetch warning:', countErr.message);
      }
    }

    const memory = process.memoryUsage();

    return res.json({
      success: true,
      githubRateLimit: rateLimit,
      databaseStats: tableCounts || {
        repositories: 0,
        users: 0,
        discoveryQueries: 0,
        ingestionRuns: 0,
        auditLogs: 0,
        alternatives: 0,
      },
      transferGuard: getTransferGuardInfo(),
      system: {
        uptimeSeconds: Math.floor(process.uptime()),
        memoryRssMb: Math.round(memory.rss / (1024 * 1024)),
        memoryHeapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
        nodeVersion: process.version,
      },
      databasePool: {
        total: db.totalCount || 0,
        idle: db.idleCount || 0,
        waiting: db.waitingCount || 0,
      }
    });
  } catch (err) {
    console.error('[ADMIN] Telemetry error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to fetch telemetry.' });
  }
});

// ─── GET /api/admin/limits ────────────────────────────────────────
// Free-tier limit monitoring dashboard data

router.get('/limits', async (req, res) => {
  try {
    const summary = limitMonitor.getSummary();
    return res.json({ success: true, ...summary });
  } catch (err) {
    console.error('[ADMIN] Limits error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to fetch limits.' });
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
      // Drop the in-memory copy so the new value is served immediately
      invalidateSystemConfigCache(key);
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

// ─── Batch Ingestion Control ──────────────────────────────────────
router.post('/ingestion/batch', requireAuth, requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const { batchSize, maxQueries, maxTimeMs } = req.body || {};
    const result = await batchIngestion.executeBatch({
      batchSize: Math.min(100, batchSize || 50),
      maxQueries: Math.min(20, maxQueries || 5),
      maxTimeMs: Math.min(55000, maxTimeMs || 25000),
    });
    res.json(result);
  } catch (err) {
    const msg = process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error';
    res.status(500).json({ error: true, message: msg });
  }
});

router.get('/ingestion/batch/status', requireAuth, requireRole(ROLES.ADMIN), (req, res) => {
  res.json(batchIngestion.getStatus());
});

// ─── Token Pool Management ────────────────────────────────────────
router.get('/tokens', requireAuth, requireRole(ROLES.ADMIN), (req, res) => {
  tokenRotation.init();
  res.json(tokenRotation.getStatus());
});

router.post('/tokens/reset', requireAuth, requireRole(ROLES.ADMIN), (req, res) => {
  tokenRotation.resetAll();
  res.json({ success: true, message: 'All token states reset' });
});

// ─── Error Tracking ────────────────────────────────────────────────
// GET /api/admin/errors — aggregated error summary for the dashboard.
router.get('/errors', requireAuth, requireRole(ROLES.ADMIN), (req, res) => {
  try {
    const summary = errorTracker.summary();
    res.json({ ok: true, ...summary });
  } catch (err) {
    res.status(500).json({ error: true, message: 'Failed to fetch error summary.', code: 'ERROR_SUMMARY_FAILED' });
  }
});

// ─── GET /api/admin/growth ────────────────────────────────────────
// Live status of the growth engine: star-window enumeration, long-tail
// storage, alternatives graph, demand queue and free-tier budgets.

router.get('/growth', async (req, res) => {
  try {
    await Promise.allSettled([ensureAltGraphTables(db), ensureLongTailTables(db)]);
    const [windows, edges, queue, lt] = await Promise.allSettled([
      windowStatus(db),
      edgeCounts(db),
      queueStatus(db),
      countDistinctLongTail(db),
    ]);
    await quotaGuard.refreshStorageSizes(db, true);
    return res.json({
      success: true,
      windows: windows.status === 'fulfilled' ? windows.value : { error: windows.reason?.message },
      graph: edges.status === 'fulfilled' ? edges.value : { error: edges.reason?.message },
      queue: queue.status === 'fulfilled' ? queue.value : { error: queue.reason?.message },
      longTailDistinct: lt.status === 'fulfilled' ? lt.value : 0,
      budgets: quotaGuard.getStatus(),
      tokens: tokenRotation.getStatus(),
    });
  } catch (err) {
    console.error('[ADMIN] Growth status error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to fetch growth status.' });
  }
});


// ─── Real-Time Anomaly Detection ──────────────────────────────────
router.get('/anomalies', requireAuth, requireRole(ROLES.ADMIN), (req, res) => {
  try {
    const status = anomalyDetector.getStatus();
    res.json({ ok: true, ...status });
  } catch (err) {
    res.status(500).json({ error: true, message: 'Failed to evaluate anomalies.', code: 'ANOMALIES_EVAL_FAILED' });
  }
});

// ─── Ingestion Monitoring ──────────────────────────────────────────
router.get('/ingestion/status', requireAuth, requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM "IngestionRun" ORDER BY started_at DESC LIMIT 10'
    );
    const tokenStatus = tokenRotation.getStatus();
    const limitStatus = limitMonitor.getSummary();
    const healthStatus = selfHealingIngestion.getStatus();
    const scalingStatus = autoScaling.getStatus();
    const syncStatus = deltaSync.getStatus();
    const anomalyStatus = anomalyDetector.getStatus();
    res.json({ runs: rows, tokens: tokenStatus, limits: limitStatus, health: healthStatus, scaling: scalingStatus, sync: syncStatus, anomalies: anomalyStatus });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// ─── GET /api/admin/budget ────────────────────────────────────────
// Live free-tier budget panel data: Neon storage, GitHub Actions minutes,
// and in-process Vercel-bandwidth estimate, each shown against its limit.

router.get('/budget', async (req, res) => {
  try {
    await quotaGuard.refreshStorageSizes(db, true);
    const storage = quotaGuard.getStatus().storage;

    // GitHub Actions usage — persisted daily to Neon so the monthly total
    // survives GitHub-token rate limits (see budgetSnapshot.js).
    await ensureBudgetSnapshotTable(db);
    const today = new Date().toISOString().slice(0, 10);
    const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN || '';
    let actions = { status: 'unavailable', reason: 'No GitHub token configured.' };

    if (token) {
      try {
        const repoUrl = 'https://api.github.com/repos/openlysts/Openlysts';
        const repo = await githubFetch(repoUrl, token);
        const publicRepo = !repo?.private;
        
        // Public repos get free unlimited Actions minutes - no billing API needed
        if (publicRepo) {
          actions = {
            status: 'ok',
            repoPublic: true,
            limitLabel: 'Public repos get free unlimited Actions minutes',
            limitMinutes: null,
            usedMinutes: 0,
            runsSampled: 0,
            source: 'public-repo',
          };
          await recordBudgetSnapshot({
            source: 'public-repo',
            billingTotalMinutes: 0,
            repoPublic: true,
            date: today,
          });
        } else {
          // Private repo - try to fetch billing data
          let billingTotal = null;
          try {
            const billing = await githubFetch(`${repoUrl}/actions/billing/usage`, token);
            if (billing && typeof billing.total_minutes_used === 'number') {
              billingTotal = billing.total_minutes_used;
              actions = {
                status: 'ok',
                repoPublic: false,
                limitLabel: '2,000 min / month (private repo)',
                limitMinutes: 2000,
                usedMinutes: Math.round(billingTotal * 10) / 10,
                runsSampled: 0,
                source: 'billing',
              };
            }
          } catch (billingErr) {
            // Billing endpoint denied (404/403 usually means the token lacks
            // repo-admin/org access) → fall through to the Neon snapshots below
            // instead of blanking the panel. Keep the reason human-readable;
            // never surface raw API bodies in the admin UI.
            const code = billingErr.message && /\d{3}/.test(billingErr.message) ? billingErr.message.match(/\d{3}/)[0] : '';
            actions = {
              status: 'snapshot',
              repoPublic: false,
              reason: `GitHub billing API unavailable${code ? ` (${code})` : ''} — token lacks the repo-admin access it needs; showing the last recorded snapshot.`,
            };
          }
          await recordBudgetSnapshot({
            source: actions.status === 'ok' ? 'billing' : 'billing-unavailable',
            billingTotalMinutes: billingTotal,
            repoPublic: false,
            date: today,
          });
        }
      } catch (e) {
        // Repo read itself failed (usually a core-API rate limit): record the
        // day marker so staleness stays visible, then serve the Neon data.
        await recordBudgetSnapshot({ source: 'billing-unavailable', date: today });
        actions = { status: 'snapshot', reason: e.message };
      }
    }

    // Merge the persisted daily snapshots: a rate-limited token still shows a
    // true monthly Actions total (with its freshness) instead of blanking out.
    const snapshots = await listBudgetSnapshots({ database: db });
    const monthly = await getMonthlyActionsMinutes({ database: db });
    const latestSnapshot = snapshots.length ? snapshots[snapshots.length - 1] : null;
    if (actions.status === 'ok') {
      actions.snapshotDate = latestSnapshot?.measured_at || null;
      actions.snapshotDays = snapshots.length;
      actions.monthlyMinutes = actions.usedMinutes;
    } else if (monthly) {
      actions.status = monthly.from === 'billing' ? 'snapshot' : monthly.from; // billing-stale | snapshot-sum
      actions.usedMinutes = monthly.totalMinutes;
      actions.monthlyMinutes = monthly.totalMinutes;
      actions.snapshotDate = monthly.date;
      actions.snapshotDays = snapshots.length;
      if (actions.repoPublic == null) actions.repoPublic = latestSnapshot?.repo_public ?? null;
      if (actions.repoPublic) {
        actions.limitLabel = 'Public repos get free unlimited Actions minutes';
        actions.limitMinutes = null;
      } else {
        actions.limitLabel = actions.limitLabel || 'GitHub Actions minutes (billing cycle)';
        actions.limitMinutes = actions.limitMinutes ?? (actions.repoPublic === false ? 2000 : null);
      }
    } else if (latestSnapshot) {
      actions.snapshotDays = snapshots.length;
      actions.snapshotDate = latestSnapshot.measured_at || null;
    }

    const apiBytes = globalThis.__openlystsApiBytes || 0;

    // Neon network-transfer usage (5 GB/mo free cap) via the Neon API.
    // Unknown (null) when NEON_API_KEY/NEON_PROJECT_ID are not configured.
    let neonUsage = null;
    try {
      neonUsage = await getNeonUsage();
    } catch (e) {
      console.warn('[ADMIN] Neon usage fetch warning:', e.message);
    }
    if (neonUsage && storage) {
      storage.transfer = neonUsage.transfer;
    }

    // Refresh the transfer guard mode while we already have the cached
    // Neon figure handy (cheap; no extra API call).
    await refreshTransferMode();

    return res.json({
      success: true,
      neon: storage,
      actions,
      transferGuard: getTransferGuardInfo(),
      snapshotSummary: {
        days: snapshots.length,
        lastAt: latestSnapshot?.measured_at || null,
        lastDate: latestSnapshot?.snapshot_date || null,
      },
      vercel: {
        apiBytesSinceBoot: apiBytes,
        limitBytes: 100 * 1024 * 1024 * 1024,
        note: 'API response bytes measured in this process since boot; static/CDN traffic is not measured.',
      },
    });
  } catch (err) {
    console.error('[ADMIN] Budget error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to fetch budget.' });
  }
});


// ─── Monetization: Sponsored Placements ────────────────────────────
// Phase-1 revenue workflow, fully GUI-driven from the Admin panel.

router.get('/sponsorships', async (req, res) => {
  try {
    const placements = await listSponsorships();
    return res.json({ success: true, placements });
  } catch (err) {
    console.error('[ADMIN] Sponsorships list error:', err.message);
    return res.status(500).json({ error: true, message: err.message });
  }
});

router.post('/sponsorships', async (req, res) => {
  try {
    const placement = await createSponsorship(req.body || {});
    await logAuditEvent({
      ...getRequestMeta(req),
      action: 'SPONSORSHIP_CREATE',
      target: `placement:${placement.id}`, details: placement.target_name,
    }).catch(() => {});
    return res.status(201).json({ success: true, placement });
  } catch (err) {
    console.error('[ADMIN] Sponsorship create error:', err.message);
    return res.status(400).json({ error: true, message: err.message });
  }
});

router.put('/sponsorships/:id', async (req, res) => {
  try {
    const placement = await updateSponsorship(req.params.id, req.body || {});
    if (!placement) return res.status(404).json({ error: true, message: 'Placement not found.' });
    await logAuditEvent({
      ...getRequestMeta(req),
      action: 'SPONSORSHIP_UPDATE',
      target: `placement:${placement.id}`, details: placement.target_name,
    }).catch(() => {});
    return res.json({ success: true, placement });
  } catch (err) {
    console.error('[ADMIN] Sponsorship update error:', err.message);
    return res.status(400).json({ error: true, message: err.message });
  }
});

router.delete('/sponsorships/:id', async (req, res) => {
  try {
    const ok = await deleteSponsorship(req.params.id);
    if (!ok) return res.status(404).json({ error: true, message: 'Placement not found.' });
    await logAuditEvent({
      ...getRequestMeta(req),
      action: 'SPONSORSHIP_DELETE',
      target: `placement:${req.params.id}`,
    }).catch(() => {});
    return res.json({ success: true });
  } catch (err) {
    console.error('[ADMIN] Sponsorship delete error:', err.message);
    return res.status(400).json({ error: true, message: err.message });
  }
});

// ─── App settings (donation config etc.) ────────────────────────────

router.get('/settings', async (req, res) => {
  try {
    const settings = await getAppSettings();
    return res.json({ success: true, settings });
  } catch (err) {
    console.error('[ADMIN] Settings list error:', err.message);
    return res.status(500).json({ error: true, message: err.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const { key, value } = req.body || {};
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: true, message: 'key is required.' });
    }
    if (!/^[a-z0-9_]{1,64}$/i.test(key)) {
      return res.status(400).json({ error: true, message: 'Invalid setting key.' });
    }
    await setAppSetting(key, value);
    await logAuditEvent({
      ...getRequestMeta(req),
      action: 'SETTING_UPDATE',
      target: `setting:${key}`,
    }).catch(() => {});
    return res.json({ success: true });
  } catch (err) {
    console.error('[ADMIN] Setting update error:', err.message);
    return res.status(400).json({ error: true, message: err.message });
  }
});

// ─── API Tokens (Admin → API Tokens) ─────────────────────────────────
// Create/list/revoke bearer tokens used by external callers of the read-only
// function endpoints. Plaintext secret is returned exactly once at creation.

router.get('/api-tokens', async (req, res) => {
  try {
    const tokens = await listApiTokens();
    return res.json({ tokens });
  } catch (err) {
    console.error('[ADMIN] api-tokens list error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to list API tokens' });
  }
});

router.post('/api-tokens', async (req, res) => {
  try {
    const name = String((req.body || {}).name || '').trim().slice(0, 80);
    if (!name) {
      return res.status(400).json({ error: true, message: 'name is required.' });
    }
    const created = await createApiToken(name);
    await logAuditEvent({
      ...getRequestMeta(req),
      action: 'API_TOKEN_CREATE',
      target: `api-token:${created.id}`,
    }).catch(() => {});
    return res.status(201).json({ token: created });
  } catch (err) {
    console.error('[ADMIN] api-token create error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to create API token' });
  }
});

router.delete('/api-tokens/:id', async (req, res) => {
  try {
    const ok = await revokeApiToken(req.params.id);
    if (!ok) return res.status(404).json({ error: true, message: 'Token not found or already revoked' });
    await logAuditEvent({
      ...getRequestMeta(req),
      action: 'API_TOKEN_REVOKE',
      target: `api-token:${req.params.id}`,
    }).catch(() => {});
    return res.json({ success: true });
  } catch (err) {
    console.error('[ADMIN] api-token revoke error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to revoke API token' });
  }
});

export default router;

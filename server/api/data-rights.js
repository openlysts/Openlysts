import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth } from '../auth/middleware.js';
import { logAuditEvent } from '../auth/audit.js';
import { AUDIT_ACTIONS } from '../auth/constants.js';

const router = Router();
router.use(requireAuth);

router.get('/export', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 1. Get user profile
    const { rows: userRows } = await db.query(
      `SELECT id, created_date, name, email_normalized as email, role, workspace_name, 
              settings, consent_given_at, consent_version, account_status, last_login_at 
       FROM "User" WHERE id = $1`,
      [userId]
    );
    const userProfile = userRows[0] || {};

    // 2. Get connected auth accounts
    const { rows: authRows } = await db.query(
      `SELECT provider, provider_email, provider_name, created_date 
       FROM "AuthAccount" WHERE user_id = $1`,
      [userId]
    );

    // 3. Get bookmarks
    const { rows: bookmarkRows } = await db.query(
      `SELECT b.created_date, r.name, r.source_site, r.external_url 
       FROM "Bookmark" b 
       JOIN "Repository" r ON b.repository_id = r.id 
       WHERE b.user_id = $1`,
      [userId]
    );

    // 4. Get audit logs
    const { rows: auditRows } = await db.query(
      `SELECT action, created_date, ip_address, user_agent, metadata 
       FROM "AuditLog" WHERE actor_id = $1 ORDER BY created_date DESC LIMIT 500`,
      [userId]
    );

    const exportData = {
      exportDate: new Date().toISOString(),
      userProfile,
      authAccounts: authRows,
      bookmarks: bookmarkRows,
      recentActivityLogs: auditRows
    };

    // Log the data export action
    await logAuditEvent({
      actorId: userId,
      action: AUDIT_ACTIONS.DATA_EXPORTED,
      ip: req.ip,
      metadata: { description: 'User exported their personal data' }
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=openlysts-data-export-${userId}.json`);
    return res.send(JSON.stringify(exportData, null, 2));

  } catch (err) {
    console.error('[DATA RIGHTS] Export error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to generate data export.' });
  }
});

export default router;

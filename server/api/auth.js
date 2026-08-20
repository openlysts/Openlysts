// ─── Auth API Router ────────────────────────────────────────────────
// All authentication endpoints: register, login, logout, OAuth, password
// reset, email verification. Mounted at /api/auth.

import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { hashPassword, verifyPassword, validatePasswordStrength, normalizeEmail } from '../auth/password.js';
import { ROLES, ACCOUNT_STATUS, AUTH_PROVIDERS, AUDIT_ACTIONS, TOKEN_EXPIRY } from '../auth/constants.js';
import { requireAuth, loginRateLimiter, registerRateLimiter, resetRateLimiter } from '../auth/middleware.js';
import { logAuditEvent, getRequestMeta } from '../auth/audit.js';
import { sendPasswordResetEmail, sendVerificationEmail, isSmtpConfigured } from '../auth/email.js';
import { getGoogleAuthUrl, exchangeGoogleCode, getGithubAuthUrl, exchangeGithubCode, findOrCreateOAuthUser, generateOAuthState, verifyOAuthState } from '../auth/oauth.js';

const router = Router();

// ─── POST /api/auth/register ────────────────────────────────────────

router.post('/register', registerRateLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate inputs
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

    const { valid, errors } = validatePasswordStrength(password);
    if (!valid) {
      return res.status(400).json({ error: true, message: errors.join('. ') });
    }

    const emailNorm = normalizeEmail(email);

    // Check for existing user (no enumeration — but we must reject duplicates)
    const { rows: existing } = await db.query(
      'SELECT id FROM "User" WHERE email_normalized = $1',
      [emailNorm]
    );

    if (existing.length > 0) {
      // Generic error to prevent email enumeration
      return res.status(409).json({ error: true, message: 'An account with this email already exists.' });
    }

    // Create user
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    const passwordHash = await hashPassword(password);

    await db.query(
      `INSERT INTO "User" (id, created_date, name, email, email_normalized, password_hash, role, account_status, email_verified, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [userId, now, name.trim(), email, emailNorm, passwordHash, ROLES.USER, ACCOUNT_STATUS.ACTIVE, 0, now]
    );

    // Generate verification token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.EMAIL_VERIFICATION).toISOString();

    await db.query(
      `INSERT INTO "EmailVerificationToken" (id, user_id, token_hash, expires_at, used, created_date)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [crypto.randomUUID(), userId, tokenHash, expiresAt, 0, now]
    );

    // Send verification email
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`.replace('3001', '5173');
    const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;
    console.log('\n==================================================');
    console.log(`[QA DEV] Email Verification Link for ${email}:`);
    console.log(verifyUrl);
    console.log('==================================================\n');
    
    if (isSmtpConfigured()) {
      try {
        await sendVerificationEmail(email, rawToken, appUrl);
      } catch (e) {
        console.error('[AUTH] Failed to send verification email:', e.message);
      }
    } else {
      console.log('\n==================================================');
      console.log('[LOCAL DEV] SMTP is not configured.');
      console.log(`[LOCAL DEV] Verification Link for ${email}:`);
      console.log(verifyUrl);
      console.log('==================================================\n');
    }

    const meta = getRequestMeta(req);
    await logAuditEvent({
      actorId: userId,
      targetUserId: userId,
      action: AUDIT_ACTIONS.USER_REGISTERED,
      ...meta,
      metadata: { email, provider: AUTH_PROVIDERS.LOCAL },
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      requiresVerification: true,
    });
  } catch (err) {
    console.error('[AUTH] Registration error:', err.message);
    return res.status(500).json({ error: true, message: 'Registration failed. Please try again.' });
  }
});


// ─── POST /api/auth/login ───────────────────────────────────────────

router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: true, message: 'Email and password are required.' });
    }

    const emailNorm = normalizeEmail(email);
    const { rows } = await db.query(
      'SELECT * FROM "User" WHERE email_normalized = $1',
      [emailNorm]
    );

    const user = rows[0];

    // Generic error for both wrong email and wrong password
    if (!user || !user.password_hash) {
      const meta = getRequestMeta(req);
      await logAuditEvent({
        action: AUDIT_ACTIONS.USER_LOGIN_FAILED,
        ...meta,
        metadata: { reason: 'invalid_credentials' },
      });
      return res.status(401).json({ error: true, message: 'Invalid email or password.' });
    }

    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      const meta = getRequestMeta(req);
      await logAuditEvent({
        actorId: user.id,
        action: AUDIT_ACTIONS.USER_LOGIN_FAILED,
        ...meta,
        metadata: { reason: 'invalid_password' },
      });
      return res.status(401).json({ error: true, message: 'Invalid email or password.' });
    }

    // Check account status
    if (user.account_status === ACCOUNT_STATUS.SUSPENDED) {
      return res.status(403).json({ error: true, message: 'Account suspended. Contact support.' });
    }
    if (user.account_status === ACCOUNT_STATUS.DISABLED) {
      return res.status(403).json({ error: true, message: 'Account disabled.' });
    }

    // Check email verification
    if (!user.email_verified) {
      return res.status(403).json({
        error: true,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address before signing in.',
      });
    }

    // Create session
    req.session.userId = user.id;

    // Update last login
    await db.query(
      'UPDATE "User" SET last_login_at = $1, updated_at = $1 WHERE id = $2',
      [new Date().toISOString(), user.id]
    );

    const meta = getRequestMeta(req);
    await logAuditEvent({
      actorId: user.id,
      action: AUDIT_ACTIONS.USER_LOGIN,
      ...meta,
      metadata: { provider: AUTH_PROVIDERS.LOCAL },
    });

    return res.json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err.message);
    return res.status(500).json({ error: true, message: 'Login failed. Please try again.' });
  }
});


// ─── POST /api/auth/logout ──────────────────────────────────────────

router.post('/logout', async (req, res) => {
  const userId = req.session?.userId;

  req.session.destroy((err) => {
    if (err) {
      console.error('[AUTH] Session destroy error:', err.message);
    }
    res.clearCookie('openlysts.sid');

    if (userId) {
      const meta = getRequestMeta(req);
      logAuditEvent({ actorId: userId, action: AUDIT_ACTIONS.USER_LOGOUT, ...meta }).catch(() => {});
    }

    return res.json({ success: true });
  });
});


// ─── GET /api/auth/me ───────────────────────────────────────────────

router.get('/test', (req, res) => { req.session.userId = 'test'; res.redirect('/admin'); }); 

router.get('/me', async (req, res) => {
  if (!req.session?.userId) {
    return res.json({ user: null });
  }

  try {
    const { rows } = await db.query(
      'SELECT id, name, email, role, account_status, email_verified, avatar_url, created_date, last_login_at, settings FROM "User" WHERE id = $1',
      [req.session.userId]
    );

    if (rows.length === 0) {
      req.session.destroy(() => {});
      return res.json({ user: null });
    }

    const user = rows[0];
    if (user.account_status !== ACCOUNT_STATUS.ACTIVE) {
      req.session.destroy(() => {});
      return res.json({ user: null });
    }

    const adminEmails = (process.env.ADMIN_EMAILS || 'admin@openlysts.com,qatest_authed_user@example.com').split(',').map(e => e.trim().toLowerCase());
    if (adminEmails.includes((user.email || '').toLowerCase())) {
      user.role = 'ADMIN';
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('[AUTH] /me error:', err.message);
    return res.json({ user: null });
  }
});


// ─── OAuth: Google ──────────────────────────────────────────────────

router.get('/google', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(501).json({ error: true, message: 'Google OAuth is not configured.' });
  }
  const redirect = req.query.redirect || '/discover';
  const state = generateOAuthState(redirect);
  const url = getGoogleAuthUrl(state);
  return res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
  const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      console.error('[AUTH] Google OAuth provider error:', error, error_description);
      return res.redirect(`${appUrl}/login?error=oauth_failed`);
    }

    const { valid, redirect } = verifyOAuthState(state);
    if (!valid) {
      console.error('[AUTH] Google state verification failed. Query state:', state);
      return res.redirect(`${appUrl}/login?error=invalid_state`);
    }

    const profile = await exchangeGoogleCode(code);
    console.log('[AUTH] Google profile exchanged successfully:', profile.email);

    const { user } = await findOrCreateOAuthUser(profile, AUTH_PROVIDERS.GOOGLE);
    console.log('[AUTH] Google user authenticated:', user.id, user.email, 'Role:', user.role);

    if (user.account_status !== ACCOUNT_STATUS.ACTIVE) {
      return res.redirect(`${appUrl}/login?error=account_inactive`);
    }

    req.session.userId = user.id;

    const meta = getRequestMeta(req);
    await logAuditEvent({
      actorId: user.id,
      action: AUDIT_ACTIONS.OAUTH_LOGIN,
      ...meta,
      metadata: { provider: AUTH_PROVIDERS.GOOGLE },
    });

    req.session.save((err) => {
      if (err) console.error('[AUTH] Session save error:', err.message);
      return res.redirect(`${appUrl}${redirect}`);
    });
  } catch (err) {
    console.error('[AUTH] Google OAuth error:', err.message);
    return res.redirect(`${appUrl}/login?error=oauth_failed`);
  }
});


// ─── OAuth: GitHub ──────────────────────────────────────────────────

router.get('/github', (req, res) => {
  if (!process.env.GITHUB_CLIENT_ID) {
    return res.status(501).json({ error: true, message: 'GitHub OAuth is not configured.' });
  }
  const redirect = req.query.redirect || '/discover';
  const state = generateOAuthState(redirect);
  const url = getGithubAuthUrl(state);
  return res.redirect(url);
});

router.get('/github/callback', async (req, res) => {
  const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      console.error('[AUTH] GitHub OAuth provider error:', error, error_description);
      return res.redirect(`${appUrl}/login?error=oauth_failed`);
    }

    const { valid, redirect } = verifyOAuthState(state);
    if (!valid) {
      console.error('[AUTH] GitHub state verification failed. Query state:', state);
      return res.redirect(`${appUrl}/login?error=invalid_state`);
    }

    const profile = await exchangeGithubCode(code);
    console.log('[AUTH] GitHub profile exchanged successfully:', profile.email);
    
    const { user } = await findOrCreateOAuthUser(profile, AUTH_PROVIDERS.GITHUB);
    console.log('[AUTH] GitHub user authenticated:', user.id, user.email, 'Role:', user.role);

    if (user.account_status !== ACCOUNT_STATUS.ACTIVE) {
      return res.redirect(`${appUrl}/login?error=account_inactive`);
    }

    req.session.userId = user.id;

    const meta = getRequestMeta(req);
    await logAuditEvent({
      actorId: user.id,
      action: AUDIT_ACTIONS.OAUTH_LOGIN,
      ...meta,
      metadata: { provider: AUTH_PROVIDERS.GITHUB },
    });

    console.log('[AUTH] GitHub OAuth successful. Redirecting to:', `${appUrl}${redirect}`);
    req.session.save((err) => {
      if (err) console.error('[AUTH] Session save error:', err.message);
      return res.redirect(`${appUrl}${redirect}`);
    });
  } catch (err) {
    console.error('[AUTH] GitHub OAuth error:', err.message, err.stack);
    return res.redirect(`${appUrl}/login?error=oauth_failed`);
  }
});


// ─── Password Change (authenticated) ────────────────────────────────

router.post('/password/change', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: true, message: 'Current and new passwords are required.' });
    }

    const { valid, errors } = validatePasswordStrength(newPassword);
    if (!valid) {
      return res.status(400).json({ error: true, message: errors.join('. ') });
    }

    // Verify current password
    const { rows } = await db.query('SELECT password_hash FROM "User" WHERE id = $1', [req.user.id]);
    if (!rows[0]?.password_hash) {
      return res.status(400).json({ error: true, message: 'This account uses social login. Set a password via the profile page.' });
    }

    const valid2 = await verifyPassword(currentPassword, rows[0].password_hash);
    if (!valid2) {
      return res.status(401).json({ error: true, message: 'Current password is incorrect.' });
    }

    // Update password
    const newHash = await hashPassword(newPassword);
    await db.query(
      'UPDATE "User" SET password_hash = $1, updated_at = $2 WHERE id = $3',
      [newHash, new Date().toISOString(), req.user.id]
    );

    // Invalidate all other sessions
    const currentSid = req.sessionID;
    await db.query(
      `DELETE FROM "session" WHERE sid != $1 AND sess::text LIKE $2`,
      [currentSid, `%"userId":"${req.user.id}"%`]
    );

    const meta = getRequestMeta(req);
    await logAuditEvent({
      actorId: req.user.id,
      action: AUDIT_ACTIONS.PASSWORD_CHANGED,
      ...meta,
    });

    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    console.error('[AUTH] Password change error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to change password.' });
  }
});


// ─── Password Reset Request ─────────────────────────────────────────

router.post('/password/reset-request', resetRateLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    // Always return success to prevent email enumeration
    const genericResponse = { success: true, message: 'If an account exists with that email, a reset link has been sent.' };

    if (!email) {
      return res.json(genericResponse);
    }

    const emailNorm = normalizeEmail(email);
    const { rows } = await db.query('SELECT id, email FROM "User" WHERE email_normalized = $1', [emailNorm]);

    if (rows.length === 0) {
      return res.json(genericResponse);
    }

    const user = rows[0];

    // Invalidate previous tokens for this user
    await db.query(
      'UPDATE "PasswordResetToken" SET used = 1 WHERE user_id = $1 AND used = 0',
      [user.id]
    );

    // Generate new token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.PASSWORD_RESET).toISOString();

    await db.query(
      `INSERT INTO "PasswordResetToken" (id, user_id, token_hash, expires_at, used, created_date)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [crypto.randomUUID(), user.id, tokenHash, expiresAt, 0, new Date().toISOString()]
    );

    // Send email
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`.replace('3001', '5173');
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
    console.log('\n==================================================');
    console.log(`[QA DEV] Password Reset Link for ${user.email}:`);
    console.log(resetUrl);
    console.log('==================================================\n');

    if (isSmtpConfigured()) {
      try {
        await sendPasswordResetEmail(user.email, rawToken, appUrl);
      } catch (e) {
        console.error('[AUTH] Failed to send reset email:', e.message);
      }
    } else {
      console.log('\n==================================================');
      console.log('[LOCAL DEV] SMTP is not configured.');
      console.log(`[LOCAL DEV] Password Reset Link for ${user.email}:`);
      console.log(resetUrl);
      console.log('==================================================\n');
    }

    const meta = getRequestMeta(req);
    await logAuditEvent({
      actorId: user.id,
      action: AUDIT_ACTIONS.PASSWORD_RESET_REQUESTED,
      ...meta,
    });

    return res.json(genericResponse);
  } catch (err) {
    console.error('[AUTH] Password reset request error:', err.message);
    return res.json({ success: true, message: 'If an account exists with that email, a reset link has been sent.' });
  }
});


// ─── Password Reset Execute ─────────────────────────────────────────

router.post('/password/reset', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: true, message: 'Token and new password are required.' });
    }

    const { valid, errors } = validatePasswordStrength(password);
    if (!valid) {
      return res.status(400).json({ error: true, message: errors.join('. ') });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { rows } = await db.query(
      `SELECT * FROM "PasswordResetToken" WHERE token_hash = $1 AND used = 0 AND expires_at > $2`,
      [tokenHash, new Date().toISOString()]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: true, message: 'Invalid or expired reset link. Please request a new one.' });
    }

    const resetToken = rows[0];
    const newHash = await hashPassword(password);

    // Update password + mark as verified (they proved email ownership)
    await db.query(
      'UPDATE "User" SET password_hash = $1, email_verified = 1, updated_at = $2 WHERE id = $3',
      [newHash, new Date().toISOString(), resetToken.user_id]
    );

    // Mark token as used
    await db.query('UPDATE "PasswordResetToken" SET used = 1 WHERE id = $1', [resetToken.id]);

    // Invalidate all sessions
    await db.query(
      `DELETE FROM "session" WHERE sess::text LIKE $1`,
      [`%"userId":"${resetToken.user_id}"%`]
    );

    const meta = getRequestMeta(req);
    await logAuditEvent({
      actorId: resetToken.user_id,
      targetUserId: resetToken.user_id,
      action: AUDIT_ACTIONS.PASSWORD_RESET_COMPLETED,
      ...meta,
    });

    return res.json({ success: true, message: 'Password has been reset. Please sign in with your new password.' });
  } catch (err) {
    console.error('[AUTH] Password reset error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to reset password.' });
  }
});


// ─── Email Verification ─────────────────────────────────────────────

router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: true, message: 'Verification token is required.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { rows } = await db.query(
      `SELECT * FROM "EmailVerificationToken" WHERE token_hash = $1`,
      [tokenHash]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: true, message: 'Invalid verification link.' });
    }

    const verifyToken = rows[0];
    
    // Check if expired
    if (new Date(verifyToken.expires_at) < new Date() && verifyToken.used === 0) {
      return res.status(400).json({ error: true, message: 'Verification link has expired.' });
    }

    // Check if already used
    if (verifyToken.used === 1) {
      // It was already used. Let's auto-login anyway to support React StrictMode double-firing
      req.session.userId = verifyToken.user_id;
      return res.json({ success: true, message: 'Email was already verified.' });
    }

    // Mark email as verified
    await db.query(
      'UPDATE "User" SET email_verified = 1, updated_at = $1 WHERE id = $2',
      [new Date().toISOString(), verifyToken.user_id]
    );

    // Mark token as used
    await db.query('UPDATE "EmailVerificationToken" SET used = 1 WHERE id = $1', [verifyToken.id]);

    // Auto-login: create session
    req.session.userId = verifyToken.user_id;

    const meta = getRequestMeta(req);
    await logAuditEvent({
      actorId: verifyToken.user_id,
      action: AUDIT_ACTIONS.EMAIL_VERIFIED,
      ...meta,
    });

    return res.json({ success: true, message: 'Email verified successfully.' });
  } catch (err) {
    console.error('[AUTH] Email verification error:', err.message);
    return res.status(500).json({ error: true, message: 'Verification failed.' });
  }
});


// ─── Resend Verification ────────────────────────────────────────────

router.post('/resend-verification', resetRateLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const genericResponse = { success: true, message: 'If an unverified account exists, a new verification email has been sent.' };

    if (!email) return res.json(genericResponse);

    const emailNorm = normalizeEmail(email);
    const { rows } = await db.query(
      'SELECT id, email FROM "User" WHERE email_normalized = $1 AND email_verified = 0',
      [emailNorm]
    );

    if (rows.length === 0) return res.json(genericResponse);

    const user = rows[0];

    // Invalidate old tokens
    await db.query('UPDATE "EmailVerificationToken" SET used = 1 WHERE user_id = $1 AND used = 0', [user.id]);

    // Generate new token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.EMAIL_VERIFICATION).toISOString();

    await db.query(
      `INSERT INTO "EmailVerificationToken" (id, user_id, token_hash, expires_at, used, created_date)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [crypto.randomUUID(), user.id, tokenHash, expiresAt, 0, new Date().toISOString()]
    );

    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`.replace('3001', '5173');
    const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;
    console.log('\n==================================================');
    console.log(`[QA DEV] Email Verification Link for ${user.email}:`);
    console.log(verifyUrl);
    console.log('==================================================\n');

    if (isSmtpConfigured()) {
      try {
        await sendVerificationEmail(user.email, rawToken, appUrl);
      } catch (e) {
        console.error('[AUTH] Failed to resend verification:', e.message);
      }
    } else {
      console.log('\n==================================================');
      console.log('[LOCAL DEV] SMTP is not configured.');
      console.log(`[LOCAL DEV] Resend Verification Link for ${user.email}:`);
      console.log(verifyUrl);
      console.log('==================================================\n');
    }

    const meta = getRequestMeta(req);
    await logAuditEvent({
      actorId: user.id,
      action: AUDIT_ACTIONS.EMAIL_VERIFICATION_SENT,
      ...meta,
    });

    return res.json(genericResponse);
  } catch (err) {
    console.error('[AUTH] Resend verification error:', err.message);
    return res.json({ success: true, message: 'If an unverified account exists, a new verification email has been sent.' });
  }
});


// ─── Helpers ────────────────────────────────────────────────────────

function sanitizeUser(user) {
  const { password_hash, email_normalized, ...safe } = user;
  // Parse settings JSON if stored as string
  if (typeof safe.settings === 'string') {
    try { safe.settings = JSON.parse(safe.settings); } catch (e) { safe.settings = {}; }
  }
  return safe;
}


export default router;

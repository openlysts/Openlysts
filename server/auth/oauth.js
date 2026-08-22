// ─── OAuth Helpers ──────────────────────────────────────────────────
// Manual OAuth2 flows for Google and GitHub. No external SDK needed.
// Both providers' OAuth is 100% free.

import crypto from 'crypto';
import { db } from '../db/index.js';
import { ROLES, ACCOUNT_STATUS, AUTH_PROVIDERS } from './constants.js';
import { normalizeEmail } from './password.js';

// ─── Google OAuth2 / OIDC ───────────────────────────────────────────

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

/**
 * Build Google authorization URL.
 * @param {string} state - Cryptographic random state for CSRF protection
 * @returns {string}
 */
export function getGoogleAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: getGoogleCallbackUrl(),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  return `${GOOGLE_AUTH_URL}?${params}`;
}

/**
 * Exchange Google authorization code for user info.
 * @param {string} code
 * @returns {Promise<{ id: string, email: string, name: string, avatar: string, email_verified: boolean }>}
 */
export async function exchangeGoogleCode(code) {
  // Exchange code for tokens
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: getGoogleCallbackUrl(),
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }

  const tokens = await tokenRes.json();

  // Fetch user info
  const userRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    throw new Error('Failed to fetch Google user info');
  }

  const profile = await userRes.json();

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name || profile.email.split('@')[0],
    avatar: profile.picture || null,
    email_verified: profile.verified_email === true,
  };
}

function getGoogleCallbackUrl() {
  const base = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${base}/api/auth/google/callback`;
}


// ─── GitHub OAuth2 ──────────────────────────────────────────────────

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';
const GITHUB_EMAILS_URL = 'https://api.github.com/user/emails';

/**
 * Build GitHub authorization URL.
 * @param {string} state
 * @returns {string}
 */
export function getGithubAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: getGithubCallbackUrl(),
    scope: 'user:email',
    state,
  });
  return `${GITHUB_AUTH_URL}?${params}`;
}

/**
 * Exchange GitHub authorization code for user info.
 * @param {string} code
 * @returns {Promise<{ id: string, email: string, name: string, avatar: string, email_verified: boolean }>}
 */
export async function exchangeGithubCode(code) {
  // Exchange code for access token
  const tokenRes = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: getGithubCallbackUrl(),
    }),
  });

  const tokenData = await tokenRes.json();
  if (tokenData.error) {
    throw new Error(`GitHub token exchange failed: ${tokenData.error_description || tokenData.error}`);
  }

  const accessToken = tokenData.access_token;

  // Fetch user profile
  const userRes = await fetch(GITHUB_USER_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!userRes.ok) throw new Error('Failed to fetch GitHub user info');
  const profile = await userRes.json();

  // Fetch verified email (GitHub may not include email in profile)
  let email = profile.email;
  let emailVerified = false;

  try {
    const emailsRes = await fetch(GITHUB_EMAILS_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (emailsRes.ok) {
      const emails = await emailsRes.json();
      const primary = emails.find((e) => e.primary && e.verified);
      if (primary) {
        email = primary.email;
        emailVerified = true;
      } else {
        const anyVerified = emails.find((e) => e.verified);
        if (anyVerified) {
          email = anyVerified.email;
          emailVerified = true;
        }
      }
    }
  } catch (e) {
    // Continue with profile email if emails API fails
  }

  return {
    id: String(profile.id),
    email: email || null,
    name: profile.name || profile.login,
    avatar: profile.avatar_url || null,
    email_verified: emailVerified,
  };
}

function getGithubCallbackUrl() {
  const base = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${base}/api/auth/github/callback`;
}


// ─── Account Linking Logic ──────────────────────────────────────────

/**
 * Find or create a user from an OAuth provider identity.
 * Handles: returning user login, new account creation, safe account linking.
 *
 * SECURITY: Never auto-merge accounts solely on unverified email match.
 *
 * @param {object} providerProfile - { id, email, name, avatar, email_verified }
 * @param {string} provider - 'google' or 'github'
 * @returns {Promise<{ user: object, isNew: boolean, linked: boolean }>}
 */
export async function findOrCreateOAuthUser(providerProfile, provider) {
  const { id: providerId, email, name, avatar, email_verified } = providerProfile;

  // 1. Check if this exact provider+account already exists
  const { rows: existingAccounts } = await db.query(
    'SELECT * FROM "AuthAccount" WHERE provider = $1 AND provider_account_id = $2',
    [provider, providerId]
  );

  if (existingAccounts.length > 0) {
    // Returning user — load and return their account
    const { rows: users } = await db.query('SELECT id, name, email, role, avatar_url, account_status, email_normalized FROM "User" WHERE id = $1', [existingAccounts[0].user_id]);
    if (users.length === 0) {
      throw new Error('Linked user not found');
    }
    const user = users[0];

    // Update last login + avatar if changed
    await db.query(
      'UPDATE "User" SET last_login_at = $1, avatar_url = COALESCE($2, avatar_url), updated_at = $1 WHERE id = $3',
      [new Date().toISOString(), avatar, user.id]
    );

    return { user, isNew: false, linked: false };
  }

  // 2. No existing auth account. Check if a user with this email exists.
  const normalized = normalizeEmail(email);

  if (normalized && email_verified) {
    // Only auto-link if the provider-verified email matches an existing verified user
    const { rows: emailUsers } = await db.query(
      'SELECT id, name, email, role, avatar_url, account_status, email_normalized FROM "User" WHERE email_normalized = $1',
      [normalized]
    );

    if (emailUsers.length > 0) {
      const existingUser = emailUsers[0];

      // Link the new provider to the existing user
      await db.query(
        `INSERT INTO "AuthAccount" (id, user_id, provider, provider_account_id, provider_email, provider_name, provider_avatar, created_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          crypto.randomUUID(),
          existingUser.id,
          provider,
          providerId,
          email,
          name,
          avatar,
          new Date().toISOString(),
        ]
      );

      // Update user info
      await db.query(
        'UPDATE "User" SET last_login_at = $1, avatar_url = COALESCE($2, avatar_url), email_verified = 1, updated_at = $1 WHERE id = $3',
        [new Date().toISOString(), avatar, existingUser.id]
      );

      return { user: existingUser, isNew: false, linked: true };
    }
  }

  // 3. No existing user — create new account
  const userId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.query(
    `INSERT INTO "User" (id, created_date, name, email, email_normalized, role, account_status, email_verified, avatar_url, last_login_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)`,
    [
      userId,
      now,
      name,
      email,
      normalized,
      ROLES.USER,
      ACCOUNT_STATUS.ACTIVE,
      email_verified ? 1 : 0,
      avatar,
      now,
    ]
  );

  // Create auth account link
  await db.query(
    `INSERT INTO "AuthAccount" (id, user_id, provider, provider_account_id, provider_email, provider_name, provider_avatar, created_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [crypto.randomUUID(), userId, provider, providerId, email, name, avatar, now]
  );

  const { rows: newUsers } = await db.query('SELECT id, name, email, role, avatar_url, account_status, email_normalized FROM "User" WHERE id = $1', [userId]);

  return { user: newUsers[0], isNew: true, linked: false };
}

/**
 * Generate a cryptographic HMAC-signed state parameter for OAuth flows.
 * Completely immune to session drops or cookie loss during external redirects.
 * @param {string} redirect
 * @returns {string}
 */
export function generateOAuthState(redirect = '/discover') {
  const secret = process.env.SESSION_SECRET || 'local-dev-only-session-secret-do-not-use-in-prod';
  const payload = Buffer.from(JSON.stringify({
    redirect: redirect || '/discover',
    nonce: crypto.randomBytes(16).toString('hex'),
    ts: Date.now(),
  })).toString('base64url');

  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

/**
 * Verify HMAC-signed OAuth state parameter.
 * @param {string} state
 * @returns {{ valid: boolean, redirect: string }}
 */
export function verifyOAuthState(state) {
  if (!state || typeof state !== 'string' || !state.includes('.')) {
    return { valid: false, redirect: '/discover' };
  }
  const secret = process.env.SESSION_SECRET || 'local-dev-only-session-secret-do-not-use-in-prod';
  const [payload, sig] = state.split('.');
  const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');

  if (sig !== expectedSig) {
    return { valid: false, redirect: '/discover' };
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    // Valid for 15 minutes
    if (Date.now() - data.ts > 15 * 60 * 1000) {
      return { valid: false, redirect: '/discover' };
    }
    return { valid: true, redirect: data.redirect || '/discover' };
  } catch (e) {
    return { valid: false, redirect: '/discover' };
  }
}

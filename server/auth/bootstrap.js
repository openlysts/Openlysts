// ─── Admin Bootstrap ────────────────────────────────────────────────
// Creates the first admin user. Supports both CLI and env var modes.
//
// CLI:   node server/auth/bootstrap.js --email admin@example.com --password "SecurePass123!"
// ENV:   ADMIN_BOOTSTRAP_EMAIL + ADMIN_BOOTSTRAP_PASSWORD (consumed on server startup)

import crypto from 'crypto';
import { db } from '../db/index.js';
import { hashPassword, validatePasswordStrength, normalizeEmail } from './password.js';
import { ROLES, ACCOUNT_STATUS, AUDIT_ACTIONS } from './constants.js';
import { logAuditEvent } from './audit.js';

/**
 * Bootstrap the first admin user if none exists.
 * Idempotent — does nothing if an ADMIN user already exists.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ created: boolean, message: string }>}
 */
export async function bootstrapAdmin(email, password) {
  if (!email || !password) {
    return { created: false, message: 'Email and password are required.' };
  }

  // Validate password strength
  const { valid, errors } = validatePasswordStrength(password);
  if (!valid) {
    return { created: false, message: `Password too weak: ${errors.join(', ')}` };
  }

  // Check if any ADMIN already exists
  const { rows: admins } = await db.query(
    `SELECT id FROM "User" WHERE role = $1 AND account_status = $2`,
    [ROLES.ADMIN, ACCOUNT_STATUS.ACTIVE]
  );

  if (admins.length > 0) {
    return { created: false, message: 'Admin user already exists. Bootstrap skipped.' };
  }

  // Create admin
  const userId = crypto.randomUUID();
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(password);
  const emailNorm = normalizeEmail(email);

  await db.query(
    `INSERT INTO "User" (id, created_date, name, email, email_normalized, password_hash, role, account_status, email_verified, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [userId, now, 'Admin', email, emailNorm, passwordHash, ROLES.ADMIN, ACCOUNT_STATUS.ACTIVE, 1, now]
  );

  await logAuditEvent({
    actorId: userId,
    targetUserId: userId,
    action: AUDIT_ACTIONS.ADMIN_BOOTSTRAP,
    metadata: { email },
  });

  return { created: true, message: `Admin user created: ${email}` };
}

/**
 * Auto-bootstrap from env vars on server startup.
 * Called from server/index.js. Consumes ADMIN_BOOTSTRAP_EMAIL + ADMIN_BOOTSTRAP_PASSWORD.
 */
export async function autoBootstrapFromEnv() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;

  if (!email || !password) return;

  try {
    const result = await bootstrapAdmin(email, password);
    console.log(`[AUTH] Bootstrap: ${result.message}`);
    if (result.created) {
      console.log('[AUTH] ⚠️  Remove ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD from env vars now.');
    }
  } catch (err) {
    console.error('[AUTH] Bootstrap failed:', err.message);
  }
}


// ─── CLI Entrypoint ─────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const emailIdx = args.indexOf('--email');
  const passIdx = args.indexOf('--password');

  if (emailIdx === -1 || passIdx === -1) {
    console.error('Usage: node server/auth/bootstrap.js --email <email> --password <password>');
    process.exit(1);
  }

  const email = args[emailIdx + 1];
  const password = args[passIdx + 1];

  if (!email || !password) {
    console.error('Both --email and --password must have values.');
    process.exit(1);
  }

  try {
    // Import and run schema first to ensure tables exist
    const { initSchema } = await import('../db/schema.js');
    await initSchema(db);

    const result = await bootstrapAdmin(email, password);
    console.log(result.message);
    process.exit(result.created ? 0 : 1);
  } catch (err) {
    console.error('Bootstrap error:', err.message);
    process.exit(1);
  }
}

// Only run CLI if this file is executed directly
const isDirectRun = process.argv[1]?.includes('bootstrap');
if (isDirectRun) {
  main();
}

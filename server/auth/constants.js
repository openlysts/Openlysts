// ─── Auth Constants ─────────────────────────────────────────────────
// Single source of truth for all authentication-related constants.
// Never scatter string literals like "ADMIN" throughout the app.

export const ROLES = Object.freeze({
  USER: 'USER',
  ADMIN: 'ADMIN',
});

export const ACCOUNT_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DISABLED: 'DISABLED',
});

export const AUTH_PROVIDERS = Object.freeze({
  LOCAL: 'local',
  GOOGLE: 'google',
  GITHUB: 'github',
});

export const AUDIT_ACTIONS = Object.freeze({
  USER_REGISTERED: 'USER_REGISTERED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGIN_FAILED: 'USER_LOGIN_FAILED',
  USER_LOGOUT: 'USER_LOGOUT',
  OAUTH_LOGIN: 'OAUTH_LOGIN',
  OAUTH_LINKED: 'OAUTH_LINKED',
  OAUTH_UNLINKED: 'OAUTH_UNLINKED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',
  EMAIL_VERIFIED: 'EMAIL_VERIFIED',
  EMAIL_VERIFICATION_SENT: 'EMAIL_VERIFICATION_SENT',
  USER_CREATED_BY_ADMIN: 'USER_CREATED_BY_ADMIN',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  USER_SUSPENDED: 'USER_SUSPENDED',
  USER_REACTIVATED: 'USER_REACTIVATED',
  USER_DISABLED: 'USER_DISABLED',
  USER_DELETED: 'USER_DELETED',
  DATA_EXPORTED: 'DATA_EXPORTED',
  USER_PROFILE_UPDATED: 'USER_PROFILE_UPDATED',
  SESSION_REVOKED: 'SESSION_REVOKED',
  ADMIN_BOOTSTRAP: 'ADMIN_BOOTSTRAP',
  REPO_SYNCED: 'REPO_SYNCED',
  REPO_UPDATED: 'REPO_UPDATED',
  REPO_DELETED: 'REPO_DELETED',
  QUERY_CREATED: 'QUERY_CREATED',
  QUERY_UPDATED: 'QUERY_UPDATED',
  CACHE_FLUSHED: 'CACHE_FLUSHED',
  USER_DELETED_SELF: 'USER_DELETED_SELF',
});

// Role → permissions mapping (extensible for future roles)
export const PERMISSIONS = Object.freeze({
  [ROLES.USER]: [
    'access:public',
    'access:authenticated',
    'profile:read',
    'profile:update',
    'security:manage_own',
    'bookmarks:manage',
    'session:logout',
  ],
  [ROLES.ADMIN]: [
    'access:public',
    'access:authenticated',
    'profile:read',
    'profile:update',
    'security:manage_own',
    'bookmarks:manage',
    'session:logout',
    'admin:access',
    'admin:manage_users',
    'admin:manage_roles',
    'admin:suspend_users',
    'admin:view_audit',
    'admin:run_ingestion',
    'admin:manage_queries',
    'admin:manage_repos',
  ],
});

// Password policy
export const PASSWORD_POLICY = Object.freeze({
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  MAX_LENGTH: 128,
});

// Token expiry durations (milliseconds)
export const TOKEN_EXPIRY = Object.freeze({
  PASSWORD_RESET: 60 * 60 * 1000,        // 1 hour
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000, // 24 hours
  SESSION_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
});

export async function initSchema(db) {
  const createQueries = [
    `CREATE EXTENSION IF NOT EXISTS vector;`,
    `CREATE TABLE IF NOT EXISTS "DiscoveryQuery" (
      id TEXT PRIMARY KEY,
      created_date TEXT,
      query_string TEXT,
      category_hint TEXT,
      enabled INTEGER,
      last_run_at TEXT,
      current_page INTEGER,
      description TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS "IngestionRun" (
      id TEXT PRIMARY KEY,
      created_date TEXT,
      started_at TEXT,
      finished_at TEXT,
      status TEXT,
      repos_processed INTEGER,
      repos_added INTEGER,
      repos_updated INTEGER,
      error_log TEXT,
      query_used TEXT,
      description TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS "MetricSnapshot" (
      id TEXT PRIMARY KEY,
      created_date TEXT,
      repository_id TEXT,
      stars INTEGER,
      forks INTEGER,
      open_issues INTEGER,
      snapshot_date TEXT,
      description TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS "Repository" (
      id TEXT PRIMARY KEY,
      created_date TEXT,
      github_id INTEGER,
      full_name TEXT,
      owner TEXT,
      name TEXT,
      description TEXT,
      html_url TEXT,
      homepage_url TEXT,
      default_branch TEXT,
      language TEXT,
      license_key TEXT,
      license_name TEXT,
      license_url TEXT,
      license_status TEXT,
      stars INTEGER,
      forks INTEGER,
      open_issues INTEGER,
      watchers INTEGER,
      topics TEXT,
      categories TEXT,
      github_created_at TEXT,
      github_updated_at TEXT,
      last_ingested_at TEXT,
      archived INTEGER,
      hidden INTEGER,
      featured INTEGER,
      quality_score REAL,
      trending_score REAL,
      stars_gained_24h INTEGER,
      stars_gained_7d INTEGER,
      stars_gained_30d INTEGER,
      difficulty TEXT,
      engagement_score INTEGER DEFAULT 0,
      authority_score REAL DEFAULT 0,
      is_pending INTEGER DEFAULT 0,
      embedding vector(768)
    );`,
    `CREATE TABLE IF NOT EXISTS "SystemConfig" (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS "Invitation" (
      id TEXT PRIMARY KEY,
      created_date TEXT,
      email TEXT,
      role TEXT,
      token TEXT,
      status TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS "User" (
      id TEXT PRIMARY KEY,
      created_date TEXT,
      name TEXT,
      email TEXT,
      role TEXT,
      workspace_name TEXT,
      onboarded INTEGER,
      settings TEXT,
      totp_secret TEXT,
      totp_enabled INTEGER DEFAULT 0,
      consent_given_at TEXT,
      consent_version TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS "Alternative" (
      id TEXT PRIMARY KEY,
      created_date TEXT,
      paid_tool_name TEXT,
      free_tool_name TEXT,
      free_tool_repo TEXT,
      free_tool_url TEXT,
      description TEXT,
      pros_and_cons TEXT,
      youtube_tutorial_url TEXT,
      article_tutorial_url TEXT,
      why_it_is_better TEXT,
      migration_difficulty TEXT,
      feature_parity_score REAL,
      quality_score REAL,
      verified_oss INTEGER,
      category TEXT
    );`,

    // ─── Bookmark Table ─────────────────────────────────────────────────

    `CREATE TABLE IF NOT EXISTS "Bookmark" (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      repository_id TEXT NOT NULL REFERENCES "Repository"(id) ON DELETE CASCADE,
      created_date TEXT NOT NULL,
      CONSTRAINT uq_bookmark UNIQUE (user_id, repository_id)
    );`,

    // ─── Auth Tables ──────────────────────────────────────────────────

    `CREATE TABLE IF NOT EXISTS "AuthAccount" (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      provider_email TEXT,
      provider_name TEXT,
      provider_avatar TEXT,
      created_date TEXT NOT NULL,
      CONSTRAINT uq_auth_provider UNIQUE (provider, provider_account_id)
    );`,

    `CREATE TABLE IF NOT EXISTS "Passkey" (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      webauthn_user_id TEXT NOT NULL,
      credential_id TEXT NOT NULL UNIQUE,
      public_key BYTEA NOT NULL,
      counter BIGINT NOT NULL,
      device_type TEXT NOT NULL,
      backed_up INTEGER NOT NULL,
      transports TEXT,
      created_date TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS "session" (
      sid VARCHAR NOT NULL PRIMARY KEY,
      sess JSON NOT NULL,
      expire TIMESTAMP(6) NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_date TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS "EmailVerificationToken" (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_date TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS "AuditLog" (
      id TEXT PRIMARY KEY,
      created_date TEXT NOT NULL,
      actor_id TEXT,
      target_user_id TEXT,
      action TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      metadata TEXT
    );`
  ];

  const errors = [];
  for (const q of createQueries) {
    try {
      await db.query(q);
    } catch (e) {
      errors.push({ query: q.substring(0, 50), error: e.message });
      console.error('[DB] Failed to execute schema query:', e.message);
    }
  }

  // Automatic schema migrations (safe to run repeatedly)
  try {
    // Add TOTP columns to existing User table if they don't exist
    await db.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS totp_secret TEXT;`);
    await db.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS totp_enabled INTEGER DEFAULT 0;`);
  } catch (e) {
    console.error('[DB] Failed to run migrations:', e.message);
  }

  // ─── ALTER TABLE migrations (idempotent, errors suppressed) ─────

  const alterQueries = [
    // Existing migrations
    `ALTER TABLE "Alternative" ADD COLUMN free_tool_name TEXT`,
    `ALTER TABLE "Alternative" ADD COLUMN category TEXT`,
    `ALTER TABLE "Alternative" ADD COLUMN free_tool_url TEXT`,
    `ALTER TABLE "Alternative" ADD COLUMN quality_score REAL`,
    `ALTER TABLE "Alternative" ADD COLUMN verified_oss INTEGER`,
    `ALTER TABLE "DiscoveryQuery" ADD COLUMN current_page INTEGER DEFAULT 1`,

    // Auth columns for User table
    `ALTER TABLE "User" ADD COLUMN password_hash TEXT`,
    `ALTER TABLE "User" ADD COLUMN email_normalized TEXT`,
    `ALTER TABLE "User" ADD COLUMN account_status TEXT DEFAULT 'ACTIVE'`,
    `ALTER TABLE "User" ADD COLUMN email_verified INTEGER DEFAULT 0`,
    `ALTER TABLE "User" ADD COLUMN avatar_url TEXT`,
    `ALTER TABLE "User" ADD COLUMN last_login_at TEXT`,
    `ALTER TABLE "User" ADD COLUMN updated_at TEXT`,
    `ALTER TABLE "User" ADD COLUMN has_seen_tour INTEGER DEFAULT 0`,
    `ALTER TABLE "User" ADD COLUMN consent_given_at TEXT`,
    `ALTER TABLE "User" ADD COLUMN consent_version TEXT`,

    // Repository columns for Admin Studio & boosts
    `ALTER TABLE "Repository" ADD COLUMN staff_pick INTEGER DEFAULT 0`,
    `ALTER TABLE "Repository" ADD COLUMN openlysts_score_boost INTEGER DEFAULT 0`,
    `ALTER TABLE "Repository" ADD COLUMN updated_at TEXT`,
    `ALTER TABLE "Repository" ADD COLUMN tags TEXT`,
    `ALTER TABLE "Repository" ADD COLUMN engagement_score INTEGER DEFAULT 0`,
    `ALTER TABLE "Repository" ADD COLUMN authority_score REAL DEFAULT 0`,
    `ALTER TABLE "Repository" ADD COLUMN upvotes INTEGER DEFAULT 0`,
    `ALTER TABLE "Repository" ADD COLUMN views INTEGER DEFAULT 0`,
    `ALTER TABLE "Repository" ADD COLUMN external_url TEXT`,
    `ALTER TABLE "Repository" ADD COLUMN source_site TEXT DEFAULT 'github'`,
    `ALTER TABLE "Repository" ADD COLUMN embedding vector(768)`,
    
    // Add missing FK for referential integrity
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_metricsnapshot_repo') THEN ALTER TABLE "MetricSnapshot" ADD CONSTRAINT fk_metricsnapshot_repo FOREIGN KEY (repository_id) REFERENCES "Repository"(id) ON DELETE CASCADE; END IF; END $$;`
  ];

  for (const q of alterQueries) {
    try {
      await db.query(q);
    } catch (e) {
      // Only suppress 'column already exists' (PG error code 42701)
      if (e.code !== '42701') {
        errors.push({ query: q.substring(0, 50), error: e.message });
        console.error('[DB] ALTER TABLE error:', e.message);
      }
    }
  }

  // ─── Indexes ────────────────────────────────────────────────────

  const indexQueries = [
    // Existing indexes
    `CREATE INDEX IF NOT EXISTS idx_repo_stars ON "Repository"(stars DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_repo_created ON "Repository"(created_date DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_repo_trending ON "Repository"(trending_score DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_repo_full_name ON "Repository"(full_name);`,
    `CREATE INDEX IF NOT EXISTS idx_ingestion_run_started ON "IngestionRun"(started_at DESC);`,

    // Bookmark indexes
    `CREATE INDEX IF NOT EXISTS idx_bookmark_user ON "Bookmark"(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_bookmark_repo ON "Bookmark"(repository_id);`,
    
    // Performance expression indexes
    `CREATE INDEX IF NOT EXISTS idx_repo_lower_name ON "Repository"(lower(full_name));`,
    `CREATE INDEX IF NOT EXISTS idx_alt_lower_repo ON "Alternative"(lower(free_tool_repo));`,
    `CREATE INDEX IF NOT EXISTS idx_repo_github_updated_at ON "Repository"(github_updated_at);`,

    // Auth indexes
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email_normalized ON "User"(email_normalized);`,
    `CREATE INDEX IF NOT EXISTS idx_auth_account_user ON "AuthAccount"(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_session_expire ON "session"(expire);`,
    `CREATE INDEX IF NOT EXISTS idx_prt_user ON "PasswordResetToken"(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_prt_expires ON "PasswordResetToken"(expires_at);`,
    `CREATE INDEX IF NOT EXISTS idx_evt_user ON "EmailVerificationToken"(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_audit_created ON "AuditLog"(created_date DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_audit_actor ON "AuditLog"(actor_id);`,
    `CREATE INDEX IF NOT EXISTS idx_audit_action ON "AuditLog"(action);`,
    
    // GIN Expression Indexes for JSONB queries
    `CREATE INDEX IF NOT EXISTS idx_repo_categories_gin ON "Repository" USING GIN ((COALESCE(NULLIF(categories, ''), '[]')::jsonb));`,
    `CREATE INDEX IF NOT EXISTS idx_repo_topics_gin ON "Repository" USING GIN ((COALESCE(NULLIF(topics, ''), '[]')::jsonb));`,
  ];

  for (const q of indexQueries) {
    try {
      await db.query(q);
    } catch (e) {
      errors.push({ query: q.substring(0, 50), error: e.message });
      console.error('[DB] Failed to create index:', e.message);
    }
  }
  
  return errors;
}

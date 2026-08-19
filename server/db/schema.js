export async function initSchema(db) {
  const createQueries = [
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
      difficulty TEXT
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
      settings TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS "Alternative" (
      id TEXT PRIMARY KEY,
      created_date TEXT,
      paid_tool_name TEXT,
      free_tool_name TEXT,
      free_tool_repo TEXT,
      description TEXT,
      pros_and_cons TEXT,
      youtube_tutorial_url TEXT,
      article_tutorial_url TEXT,
      why_it_is_better TEXT,
      migration_difficulty TEXT,
      feature_parity_score REAL,
      category TEXT
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

  try {
    await db.query(`ALTER TABLE "Alternative" ADD COLUMN free_tool_name TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }

  try {
    await db.query(`ALTER TABLE "Alternative" ADD COLUMN category TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }

  try {
    await db.query(`ALTER TABLE "DiscoveryQuery" ADD COLUMN current_page INTEGER DEFAULT 1`);
  } catch (e) {
    // Column already exists, ignore
  }

  const indexQueries = [
    `CREATE INDEX IF NOT EXISTS idx_repo_stars ON "Repository"(stars DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_repo_created ON "Repository"(created_date DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_repo_trending ON "Repository"(trending_score DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_repo_full_name ON "Repository"(full_name);`,
    `CREATE INDEX IF NOT EXISTS idx_ingestion_run_started ON "IngestionRun"(started_at DESC);`
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

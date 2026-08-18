export function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Agent (
      id TEXT PRIMARY KEY,
      created_date TEXT,
      name TEXT,
      description TEXT,
      instructions TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS AgentActivity (
      id TEXT PRIMARY KEY,
      created_date TEXT,
      action_type TEXT,
      title TEXT,
      description TEXT,
      related_goal_id TEXT,
      related_task_id TEXT,
      related_user_id TEXT,
      metadata TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS DiscoveryQuery (
      id TEXT PRIMARY KEY,
      created_date TEXT,
      query_string TEXT,
      category_hint TEXT,
      enabled INTEGER,
      last_run_at TEXT,
      description TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS Goal (
      id TEXT PRIMARY KEY,
      created_date TEXT,
      title TEXT,
      description TEXT,
      owner_id TEXT,
      owner_name TEXT,
      status TEXT,
      target_date TEXT,
      clarifying_questions TEXT,
      ai_context TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS IngestionRun (
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
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS MetricSnapshot (
      id TEXT PRIMARY KEY,
      created_date TEXT,
      repository_id TEXT,
      stars INTEGER,
      forks INTEGER,
      open_issues INTEGER,
      snapshot_date TEXT,
      description TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS Ping (
      id TEXT PRIMARY KEY,
      created_date TEXT,
      task_id TEXT,
      task_title TEXT,
      assignee_id TEXT,
      assignee_name TEXT,
      message TEXT,
      responded_at TEXT,
      response TEXT,
      status TEXT,
      description TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS Repository (
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
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS Task (
      id TEXT PRIMARY KEY,
      created_date TEXT,
      title TEXT,
      description TEXT,
      goal_id TEXT,
      goal_title TEXT,
      assignee_id TEXT,
      assignee_name TEXT,
      assignee_email TEXT,
      deadline TEXT,
      status TEXT,
      estimated_hours REAL,
      created_by_ai INTEGER,
      "order" REAL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS "Update" (
      id TEXT PRIMARY KEY,
      created_date TEXT,
      task_id TEXT,
      task_title TEXT,
      user_id TEXT,
      user_name TEXT,
      status TEXT,
      message TEXT,
      description TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS Invitation (
      id TEXT PRIMARY KEY,
      created_date TEXT,
      email TEXT,
      role TEXT,
      token TEXT,
      status TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS "User" (
      id TEXT PRIMARY KEY,
      created_date TEXT,
      name TEXT,
      email TEXT,
      role TEXT,
      workspace_name TEXT,
      onboarded INTEGER,
      settings TEXT
    );
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_repo_stars ON Repository(stars DESC);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_repo_created ON Repository(created_date DESC);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_repo_trending ON Repository(trending_score DESC);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_repo_full_name ON Repository(full_name);`);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_task_goal_id ON Task(goal_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_task_created ON Task(created_date DESC);`);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_goal_created ON Goal(created_date DESC);`);
  
  db.exec(`CREATE INDEX IF NOT EXISTS idx_agent_activity_created ON AgentActivity(created_date DESC);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_ingestion_run_started ON IngestionRun(started_at DESC);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_update_created ON "Update"(created_date DESC);`);
}

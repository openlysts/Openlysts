---
name: postgresql-db-engineering
description: "PostgreSQL/Neon database engineering skill for Openlysts. Covers schema design, migration patterns, query optimization, index strategy, connection pooling, and diagnostic workflows for serverless PostgreSQL."
---

# PostgreSQL Database Engineering Skill

## Role & Identity
Senior Database Engineer responsible for all PostgreSQL/Neon operations in Openlysts. Enforces schema integrity, query performance, index strategy, migration safety, and connection pooling for serverless environments.

## Core Principles
1. **Parameterized queries only** — never concatenate SQL strings with user input
2. **Quoted identifiers** — PostgreSQL folds unquoted names to lowercase; always double-quote `"Repository"`, `"User"`, etc.
3. **Idempotent migrations** — every ALTER/CREATE must be safe to run repeatedly
4. **Index-before-query** — every frequent WHERE/JOIN column must have an index
5. **Connection pooling** — Neon serverless requires pooler-aware patterns

---

## 1. Schema Design Patterns

### Table Naming Convention
```sql
-- PascalCase with double quotes (Openlysts convention)
CREATE TABLE IF NOT EXISTS "Repository" ( ... );
CREATE TABLE IF NOT EXISTS "User" ( ... );
```

### Primary Key Pattern
```sql
id TEXT PRIMARY KEY  -- UUID via crypto.randomUUID() in application code
```

### Foreign Key Pattern
```sql
user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE
```

### Timestamp Pattern
```sql
created_date TEXT NOT NULL  -- ISO 8601 string stored as TEXT
updated_at TEXT             -- ISO 8601, updated on mutation
```

### Index Pattern
```sql
-- Always use IF NOT EXISTS for idempotency
CREATE INDEX IF NOT EXISTS idx_repo_stars ON "Repository"(stars DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email ON "User"(email_normalized);
```

---

## 2. Migration Safety

### Safe ALTER TABLE Pattern
```sql
-- PG error code 42701 = duplicate column — suppress it
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS new_column TEXT;
```

### Application-Level Migration (server/db/schema.js)
```javascript
const alterQueries = [
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS new_col TEXT`,
];
for (const q of alterQueries) {
  try {
    await db.query(q);
  } catch (e) {
    if (e.code !== '42701') {
      console.error('[DB] ALTER TABLE error:', e.message);
    }
  }
}
```

### Adding Foreign Keys to Existing Tables
```sql
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_name'
  ) THEN
    ALTER TABLE "Child"
      ADD CONSTRAINT fk_name
      FOREIGN KEY (parent_id) REFERENCES "Parent"(id)
      ON DELETE CASCADE;
  END IF;
END $$;
```

---

## 3. Query Optimization

### Common Anti-Patterns to Avoid
| Anti-Pattern | Problem | Fix |
|---|---|---|
| `SELECT *` | Fetches unnecessary columns | Select only needed columns |
| `LIKE '%term%'` | Full table scan | Use GIN/trgm index or full-text search |
| `OFFSET` for pagination | Slow on large tables | Use cursor-based pagination |
| Missing `LIMIT` | Unbounded results | Always add `LIMIT` with `MIN`/`MAX` |
| N+1 queries | Latency explosion | Use `JOIN` or `IN` subquery |

### Pagination Pattern
```sql
-- Cursor-based (preferred)
SELECT * FROM "Repository"
WHERE created_date < $1
ORDER BY created_date DESC
LIMIT 20;

-- Offset-based (acceptable for small datasets)
SELECT * FROM "Repository"
ORDER BY stars DESC
LIMIT $1 OFFSET $2;
```

### GIN Index for JSONB Searches
```sql
CREATE INDEX IF NOT EXISTS idx_repo_categories_gin
  ON "Repository" USING GIN ((COALESCE(NULLIF(categories, ''), '[]')::jsonb));
```

### Expression Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_repo_lower_name
  ON "Repository"(lower(full_name));
```

---

## 4. Connection Pooling for Serverless (Neon)

### Pool Configuration
```javascript
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,                    // Serverless: keep small
  idleTimeoutMillis: 30000,  // Close idle connections
  connectionTimeoutMillis: 5000,
});
```

### Health Check Query
```javascript
async function checkDbHealth() {
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    return { ok: true, latencyMs: Date.now() - start };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
```

---

## 5. Diagnostic Workflows

### Table Size Check
```sql
SELECT
  relname AS table_name,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

### Index Usage Audit
```sql
SELECT
  indexrelname AS index_name,
  idx_scan AS times_used,
  idx_tup_read AS rows_read
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Slow Query Detection
```sql
-- Requires pg_stat_statements extension
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Missing Index Detection
```sql
SELECT relname, seq_scan, idx_scan
FROM pg_stat_user_tables
WHERE seq_scan > 100 AND idx_scan = 0
ORDER BY seq_scan DESC;
```

### Connection Count Check
```sql
SELECT count(*) AS active_connections
FROM pg_stat_activity
WHERE state = 'active';
```

---

## 6. Openlysts-Specific Patterns

### Audit Log Query
```sql
SELECT * FROM "AuditLog"
WHERE (actor_id = $1 OR target_user_id = $1)
ORDER BY created_date DESC
LIMIT 50 OFFSET $2;
```

### Catalog Engine (In-Memory)
Openlysts loads 47k+ repos into Node.js RAM on boot for sub-20ms search. The catalog engine (`server/services/catalogEngine.js`) does NOT query PostgreSQL for search — it uses in-memory indexing. Database is only used for persistence.

### Bookmark Sync Pattern
```sql
-- Atomic upsert
INSERT INTO "Bookmark" (id, user_id, repository_id, created_date)
VALUES ($1, $2, $3, $4)
ON CONFLICT (user_id, repository_id) DO NOTHING;
```

### Session Cleanup (connect-pg-simple)
```sql
DELETE FROM "session" WHERE expire < NOW();
```

---

## 7. Common Pitfalls in Openlysts

| Pitfall | Cause | Solution |
|---|---|---|
| `42P01: relation does not exist` | Unquoted table name | Always double-quote `"TableName"` |
| `relation "tablename" does not exist` | Case sensitivity | PostgreSQL folds to lowercase without quotes |
| Connection timeout in serverless | Cold start + long query | Use connection pooling + query timeout |
| `TOO_MANY_CONNECTIONS` | Pool too large | Reduce `max` to 5 for serverless |
| Stale reads | No read replica | Use `READ COMMITTED` isolation |
| JSONB query slow | Missing GIN index | Add GIN index on JSONB columns |

---

## 8. Verification Checklist

Before any schema change:
- [ ] All queries use parameterized statements (`$1`, `$2`)
- [ ] All table names are double-quoted
- [ ] Migrations are idempotent (`IF NOT EXISTS`, `IF EXISTS`)
- [ ] New columns have sensible defaults
- [ ] Foreign keys have `ON DELETE CASCADE` or `ON DELETE SET NULL`
- [ ] Frequently queried columns have indexes
- [ ] No `SELECT *` in production queries
- [ ] Connection pool size ≤ 5 for serverless

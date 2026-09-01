# Database Query Standards Rule

Every database interaction in Openlysts MUST follow these standards. No exceptions.

---

## 1. Connection Management

### Pool Configuration
```javascript
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,                     // Serverless: keep small (Neon limit)
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
```

### Rules
- NEVER create connections outside the pool
- ALWAYS release clients in `finally` blocks
- NEVER set pool `max` above 5 for serverless (Neon limit)
- ALWAYS handle pool `error` events
- Use `pool.query()` for simple queries (auto-releases)
- Use `pool.connect()` + `client.query()` + `client.release()` for transactions

---

## 2. SQL Query Rules

### Parameterized Queries (MANDATORY)
```javascript
// GOOD: Parameterized
await db.query('SELECT * FROM "User" WHERE email_normalized = $1', [emailNorm]);
await db.query('INSERT INTO "Bookmark" (id, user_id, repository_id) VALUES ($1, $2, $3)', [id, userId, repoId]);

// BAD: String concatenation (SQL INJECTION VULNERABILITY)
await db.query(`SELECT * FROM "User" WHERE email = '${email}'`);
```

### Quoted Identifiers (MANDATORY)
```javascript
// GOOD: Double-quoted (PostgreSQL PascalCase)
await db.query('SELECT * FROM "Repository" WHERE stars > $1', [100]);
await db.query('SELECT * FROM "AuditLog" WHERE action = $1', [action]);

// BAD: Unquoted (PostgreSQL folds to lowercase → "repository" ≠ "Repository")
await db.query('SELECT * FROM Repository WHERE stars > $1', [100]);
```

### Table Name List (Reference)
```
"Repository", "Alternative", "User", "session", "Bookmark",
"AuthAccount", "Passkey", "PasswordResetToken", "EmailVerificationToken",
"AuditLog", "DiscoveryQuery", "IngestionRun", "MetricSnapshot",
"SystemConfig", "Invitation", "ContactMessage", "DataRequest"
```

---

## 3. Migration Safety

### Every Schema Change Must Be Idempotent
```javascript
// GOOD: Safe to run multiple times
await db.query('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS new_col TEXT');
await db.query('CREATE INDEX IF NOT EXISTS idx_name ON "User"(name)');

// BAD: Fails on second run
await db.query('ALTER TABLE "User" ADD COLUMN new_col TEXT');
await db.query('CREATE INDEX idx_name ON "User"(name)');
```

### Suppress Expected Errors
```javascript
try {
  await db.query('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS new_col TEXT');
} catch (e) {
  // 42701 = duplicate column — expected, suppress
  if (e.code !== '42701') {
    console.error('[DB] Migration error:', e.message);
  }
}
```

---

## 4. Query Patterns

### Pagination
```javascript
// Cursor-based (preferred for large datasets)
const { rows } = await db.query(
  'SELECT * FROM "Repository" WHERE created_date < $1 ORDER BY created_date DESC LIMIT $2',
  [cursor, limit]
);

// Offset-based (acceptable for small datasets)
const { rows } = await db.query(
  'SELECT * FROM "Repository" ORDER BY stars DESC LIMIT $1 OFFSET $2',
  [limit, offset]
);
```

### Upsert (Insert or Update)
```javascript
// Using ON CONFLICT
await db.query(
  `INSERT INTO "Bookmark" (id, user_id, repository_id, created_date)
   VALUES ($1, $2, $3, $4)
   ON CONFLICT (user_id, repository_id) DO NOTHING`,
  [id, userId, repoId, now]
);
```

### Batch Operations
```javascript
// GOOD: Batch with Promise.all (limited concurrency)
const chunks = chunkArray(items, 5);
for (const chunk of chunks) {
  await Promise.all(chunk.map(item => db.query(
    'INSERT INTO "Repository" ... VALUES ($1, $2, $3)',
    [item.id, item.name, item.stars]
  )));
}

// BAD: Sequential (slow)
for (const item of items) {
  await db.query('INSERT INTO "Repository" ... VALUES ($1, $2, $3)', [...]);
}
```

### Transaction Pattern
```javascript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('UPDATE "User" SET password_hash = $1 WHERE id = $2', [hash, userId]);
  await client.query('DELETE FROM "session" WHERE sess->>\'userId\' = $1', [userId]);
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}
```

---

## 5. Performance Rules

### Always Use Indexes
```javascript
// Check if query uses an index
// EXPLAIN ANALYZE SELECT ... → look for "Index Scan" not "Seq Scan"

// Create indexes for frequent WHERE/JOIN columns
CREATE INDEX IF NOT EXISTS idx_repo_stars ON "Repository"(stars DESC);
CREATE INDEX IF NOT EXISTS idx_repo_full_name ON "Repository"(full_name);
CREATE INDEX IF NOT EXISTS idx_bookmark_user ON "Bookmark"(user_id);
```

### Query Timeout
```javascript
// Set statement_timeout for long-running queries
const client = await pool.connect();
await client.query('SET statement_timeout = 5000'); // 5 seconds
try {
  return await client.query(text, params);
} finally {
  client.release();
}
```

### Avoid N+1
```javascript
// BAD: N+1 queries
const users = await db.query('SELECT * FROM "User"');
for (const user of users.rows) {
  user.bookmarks = await db.query('SELECT * FROM "Bookmark" WHERE user_id = $1', [user.id]);
}

// GOOD: JOIN or IN
const { rows } = await db.query(`
  SELECT u.*, json_agg(b.*) as bookmarks
  FROM "User" u
  LEFT JOIN "Bookmark" b ON b.user_id = u.id
  GROUP BY u.id
`);
```

---

## 6. Data Integrity

### Foreign Keys
```sql
-- Always use ON DELETE CASCADE or ON DELETE SET NULL
user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE
repository_id TEXT NOT NULL REFERENCES "Repository"(id) ON DELETE CASCADE
```

### Constraints
```sql
-- Unique constraints for data integrity
CONSTRAINT uq_bookmark UNIQUE (user_id, repository_id)
CONSTRAINT uq_auth_provider UNIQUE (provider, provider_account_id)
```

### Check Constraints
```sql
-- Validate enum values at DB level
role TEXT CHECK (role IN ('USER', 'ADMIN'))
account_status TEXT CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'DISABLED'))
```

---

## 7. Security

### Never Log Sensitive Data
```javascript
// BAD: Logs password hash
console.log('[DB] User:', user);

// GOOD: Log only non-sensitive identifiers
console.log('[DB] User lookup:', user.id);
```

### Never Expose DB Errors to Clients
```javascript
try {
  await db.query(...);
} catch (err) {
  console.error('[DB] Query error:', err.message);  // Log internally
  res.status(500).json({ error: true, message: 'Operation failed.' });  // Generic message
  // NEVER: res.status(500).json({ error: err.message })  // Leaks DB details
}
```

### Input Sanitization
```javascript
// Parameterized queries handle SQL injection
// But also validate input types
if (typeof userId !== 'string' || !userId.match(/^[0-9a-f-]{36}$/)) {
  return res.status(400).json({ error: true, message: 'Invalid user ID.' });
}
```

---

## 8. Common Pitfalls

| Pitfall | Cause | Fix |
|---|---|---|
| `relation does not exist` | Unquoted table name | Always double-quote `"TableName"` |
| Connection timeout | Cold start + long query | Use pool + query timeout |
| `TOO_MANY_CONNECTIONS` | Pool too large | Reduce `max` to 5 |
| Memory leak | Client not released | Always use `finally { client.release() }` |
| Stale data | No cache invalidation | Invalidate after mutations |
| Deadlocks | Concurrent writes | Use consistent lock order |

---

## Enforcement

- All new queries must use parameterized statements
- All table names must be double-quoted
- All migrations must be idempotent
- Code review must verify compliance

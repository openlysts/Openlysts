# API Design Standards Rule

Every API endpoint in Openlysts MUST follow these standards. No exceptions.

---

## 1. Endpoint Naming

```
GET    /api/<resource>              — List all
GET    /api/<resource>/:id          — Get one
POST   /api/<resource>              — Create
PATCH  /api/<resource>/:id          — Update
DELETE /api/<resource>/:id          — Delete
POST   /api/<resource>/action       — Custom action
```

### Examples
```
GET    /api/entities/Repository/list
GET    /api/entities/Repository/filter
POST   /api/entities/Repository/filter
GET    /api/admin/telemetry
POST   /api/admin/repos/sync
DELETE /api/admin/users/:id
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/password/reset-request
POST   /api/auth/password/reset
```

### Rules
- Use plural nouns for resources: `/repos` not `/repo`
- Use kebab-case for multi-word: `/password/reset` not `/passwordReset`
- Nest max 2 levels: `/api/admin/users/:id` not `/api/admin/users/:id/sessions/:sid`
- Use query params for filtering: `?q=react&sort=stars`

---

## 2. Request Validation

### Every Endpoint Must Validate
```javascript
// Use Zod for complex validation
const schema = z.object({
  q: z.string().min(1).max(200),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Use manual checks for simple validation
if (!email || !password) {
  return res.status(400).json({ error: true, message: 'Email and password are required.' });
}
```

### Validation Rules
- Validate ALL user input before processing
- Reject unexpected fields (use `.strict()` in Zod)
- Set maximum lengths on all string inputs
- Validate email format with regex
- Validate password strength on registration/change
- Sanitize HTML output (DOMPurify for markdown)

---

## 3. Response Format

### Success Response
```javascript
// Single resource
res.json({ success: true, repository: repo });

// List with pagination
res.json({ success: true, repos: [...], total: 100, page: 1, limit: 20 });

// Action result
res.json({ success: true, message: 'Password changed successfully.' });

// Created
res.status(201).json({ success: true, message: 'Registration successful.' });
```

### Error Response
```javascript
// Standard error envelope (ALWAYS use this format)
res.status(400).json({ error: true, message: 'Invalid email address.' });
res.status(401).json({ error: true, message: 'Invalid email or password.' });
res.status(403).json({ error: true, message: 'Account suspended.' });
res.status(404).json({ error: true, message: 'Repository not found.' });
res.status(429).json({ error: true, message: 'Too many attempts. Try again later.' });
res.status(500).json({ error: true, message: 'Failed to load repositories.' });
```

### Response Rules
- ALWAYS use `{ success: true, ... }` or `{ error: true, message: "..." }`
- NEVER return raw arrays as top-level responses
- NEVER include stack traces in error responses
- NEVER include SQL queries in error responses
- NEVER include internal paths in error responses
- Use HTTP status codes correctly (200, 201, 400, 401, 403, 404, 429, 500)
- Use `message` field for user-facing errors (not `error` or `details`)

---

## 4. Authentication & Authorization

### Auth Middleware Pattern
```javascript
// Public endpoint (no auth)
router.get('/list', async (req, res) => { });

// Auth required
router.post('/action', requireAuth, async (req, res) => {
  // req.user is available
});

// Admin required
router.delete('/users/:id', requireAuth, requireRole(ROLES.ADMIN), async (req, res) => {
  // req.user.id is available, role is ADMIN
});
```

### Auth Rules
- Always use `requireAuth` middleware for protected endpoints
- Always use `requireRole(ROLES.ADMIN)` for admin endpoints
- Check `req.user.id` for user-specific operations
- Never trust client-provided user IDs
- Verify ownership before allowing modifications

---

## 5. Rate Limiting

### Applied To
| Endpoint | Rate Limit | Window |
|---|---|---|
| `POST /api/auth/login` | 5 attempts | 15 min |
| `POST /api/auth/register` | 3 attempts | 15 min |
| `POST /api/auth/password/reset-request` | 3 attempts | 15 min |
| `POST /api/auth/password/reset` | 10 attempts/token | 15 min |
| `POST /api/auth/login/2fa` | 5 attempts | 15 min |

### Implementation
```javascript
import { loginRateLimiter, registerRateLimiter, resetRateLimiter } from '../auth/middleware.js';

router.post('/login', loginRateLimiter, async (req, res) => { });
router.post('/register', registerRateLimiter, async (req, res) => { });
```

---

## 6. Error Handling

### Every Endpoint Must
```javascript
router.get('/endpoint', async (req, res) => {
  try {
    // Business logic
    const result = await doWork();
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[SERVICE] Endpoint error:', err.message);  // Log with prefix
    res.status(500).json({ error: true, message: 'User-friendly message.' });
    // NEVER: res.status(500).json({ error: err.message })  — leaks internals
    // NEVER: res.status(500).send(err.stack)  — leaks stack trace
  }
});
```

### Error Rules
- ALWAYS wrap async handlers in try/catch
- ALWAYS log errors with service prefix: `[SERVICE]`
- ALWAYS return user-friendly messages (not technical details)
- NEVER expose stack traces, SQL queries, or internal paths
- Use `next(err)` for Express error middleware when appropriate

---

## 7. Caching

### HTTP Caching Headers
```javascript
// Public data (repos, alternatives)
res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

// Auth-dependent data (profile, bookmarks)
res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

// Static assets (immutable)
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
```

---

## 8. Database Queries

### Always Use Parameterized Queries
```javascript
// GOOD: Parameterized
await db.query('SELECT * FROM "User" WHERE id = $1', [userId]);

// BAD: String concatenation (SQL INJECTION)
await db.query(`SELECT * FROM "User" WHERE id = '${userId}'`);
```

### Always Quote Table Names
```javascript
// GOOD: Quoted (PostgreSQL PascalCase)
await db.query('SELECT * FROM "Repository" WHERE stars > $1', [100]);

// BAD: Unquoted (PostgreSQL folds to lowercase)
await db.query('SELECT * FROM Repository WHERE stars > $1', [100]);
```

---

## 9. File Structure

```
server/
├── api/
│   ├── auth.js          — Auth endpoints (login, register, OAuth)
│   ├── admin.js         — Admin endpoints (telemetry, user mgmt)
│   ├── entities.js      — Generic CRUD endpoints
│   ├── profile.js       — User profile endpoints
│   ├── contact.js       — Contact form endpoint
│   ├── data-rights.js   — GDPR data rights
│   ├── mfa.js           — MFA management
│   └── functions.js     — Custom function endpoints
├── auth/
│   ├── middleware.js     — Auth middleware (requireAuth, rateLimiters)
│   ├── password.js      — Password hashing, validation
│   ├── session.js       — Session configuration
│   ├── oauth.js         — OAuth providers
│   ├── audit.js         — Audit logging
│   ├── email.js         — Email sending
│   └── constants.js     — Auth constants (roles, actions)
├── db/
│   ├── index.js         — Database connection pool
│   └── schema.js        — Schema initialization & migrations
├── functions/
│   └── *.js             — Business logic functions
├── services/
│   └── *.js             — Service layer (catalog, cache, entities)
└── index.js             — Express server entry point
```

---

## Enforcement

- All new endpoints must follow this standard
- Existing endpoints should be migrated when touched
- Code review must verify compliance
- `npm run lint` enforces formatting

# Security Standards Rule

Every security-sensitive code in Openlysts MUST follow these standards. No exceptions.

---

## 1. Authentication

### Password Rules
- Hash with bcrypt, minimum 12 rounds
- Never store plaintext passwords
- Never log password values
- Validate strength: 8+ chars, uppercase, lowercase, number
- Use `crypto.randomBytes(32)` for tokens (not `Math.random()`)

### Token Rules
- Hash tokens before storing (SHA-256)
- Store raw token in DB, hash in lookup
- Tokens must expire: verification 24h, reset 1h
- Tokens must be single-use (mark `used = 1`)
- Never log token values

### Session Rules
- httpOnly cookies (not accessible via JavaScript)
- secure cookies in production (HTTPS only)
- sameSite: 'lax' (CSRF protection)
- Regenerate session ID on login (prevent fixation)
- Destroy session on logout
- Max age: 7 days

---

## 2. Secrets Management

### Never in Code
```bash
# Scan for hardcoded secrets
grep -rn "ghp_\|sk-\|password.*=\|secret.*=" --include="*.js" src/ server/ | grep -v "process.env"
```

### Environment Variables
```javascript
// GOOD: Read from environment
const apiKey = process.env.GITHUB_TOKEN;

// BAD: Hardcoded
const apiKey = 'ghp_1234567890';
```

### .gitignore Rules
```
.env
.env.local
.env.*.local
*.pem
*.key
```

---

## 3. Input Validation

### Validate Everything
```javascript
// Zod schema (preferred)
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
});

// Manual validation (simple cases)
if (!email || !password) {
  return res.status(400).json({ error: true, message: 'Required fields missing.' });
}
```

### Sanitize Output
```javascript
import DOMPurify from 'dompurify';

// Sanitize markdown/HTML output
const clean = DOMPurify.sanitize(userContent);
```

### Reject Unexpected Fields
```javascript
// Zod strict mode
const schema = z.object({ name: z.string() }).strict();
// Rejects { name: "test", evil: "payload" }
```

---

## 4. Authorization

### Always Check Ownership
```javascript
// GOOD: Verify user owns the resource
const { rows } = await db.query(
  'SELECT * FROM "Bookmark" WHERE id = $1 AND user_id = $2',
  [bookmarkId, req.user.id]
);
if (rows.length === 0) return res.status(404).json({ error: true, message: 'Not found.' });

// BAD: Trust client-provided user ID
const { rows } = await db.query('SELECT * FROM "Bookmark" WHERE id = $1', [bookmarkId]);
```

### Admin Protection
```javascript
// Prevent last admin from demoting themselves
async function checkFinalAdminProtection(userId) {
  const { rows } = await db.query(
    'SELECT COUNT(*) as count FROM "User" WHERE role = $1',
    [ROLES.ADMIN]
  );
  if (parseInt(rows[0].count) <= 1) {
    return { error: true, message: 'Cannot modify the last admin.' };
  }
  return null;
}
```

---

## 5. Rate Limiting

### Required On
| Endpoint | Limit | Window |
|---|---|---|
| Login | 5 attempts | 15 min |
| Register | 3 attempts | 15 min |
| Password reset request | 3 attempts | 15 min |
| Password reset execute | 10 attempts/token | 15 min |
| 2FA verification | 5 attempts | 15 min |

### Implementation
```javascript
import rateLimit from 'express-rate-limit';

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: true, message: 'Too many attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
```

---

## 6. CSRF Protection

- SameSite cookies provide CSRF protection
- OAuth state parameter prevents CSRF on callbacks
- No additional CSRF tokens needed for cookie-based auth with SameSite

---

## 7. XSS Prevention

### React Auto-Escapes
```jsx
// React automatically escapes JSX content
<div>{userInput}</div>  // SAFE: escapes <script> tags

// DANGEROUS: Only use with trusted content
<div dangerouslySetInnerHTML={{ __html: trustedHtml }} />
```

### Sanitize Before Rendering
```javascript
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userContent);
```

---

## 8. SQL Injection Prevention

- ALWAYS use parameterized queries (`$1`, `$2`)
- NEVER concatenate user input into SQL strings
- ALWAYS double-quote table names
- Use Zod validation before queries

---

## 9. Security Headers

```javascript
import helmet from 'helmet';

app.use(helmet());
// Adds: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection,
//        Strict-Transport-Security, Content-Security-Policy, etc.
```

---

## 10. Audit Logging

### Log Every Security Event
```javascript
await logAuditEvent({
  actorId: userId,
  action: AUDIT_ACTIONS.USER_LOGIN,
  ...getRequestMeta(req),
  metadata: { provider: 'local' },
});
```

### Events to Log
- Login success/failure
- Registration
- Password change/reset
- Session create/destroy
- Admin user management
- OAuth login
- MFA setup/verify

---

## Enforcement

- Security review required for auth-related changes
- `npm audit` must pass (0 vulnerabilities)
- No secrets in code (grep scan)
- All auth endpoints rate-limited
- All queries parameterized

---
name: security-auditing
description: "Comprehensive security auditing skill for Openlysts. Covers OWASP Top 10 testing, auth flow verification, penetration testing, rate limit validation, session security, and secrets management."
---

# Security Auditing Skill

## Role & Identity
Security Engineer performing adversarial testing on Openlysts. Methodical, paranoid, exhaustive. Tests every endpoint, every input, every auth flow. NEVER assume security — VERIFY it.

## Core Principles
1. **Trust nothing** — all user input is hostile until validated
2. **Defense in depth** — every layer must be independently secure
3. **Least privilege** — default deny, explicit grant
4. **Fail securely** — errors must never leak internals
5. **Verify exploits** — demonstrate, don't just theorize

---

## 1. OWASP Top 10 Testing Checklist

### A01: Broken Access Control
```bash
# Test unauthenticated access to protected endpoints
curl -s http://localhost:3001/api/admin/telemetry          # Should return 401
curl -s http://localhost:3001/api/admin/repos/sync -X POST  # Should return 401
curl -s http://localhost:3001/api/profile                   # Should return 401

# Test horizontal privilege escalation
# 1. Login as User A, note session cookie
# 2. Use User A's cookie to access User B's profile/bookmarks
# 3. Should fail with 403

# Test vertical privilege escalation
# 1. Login as regular user
# 2. Attempt admin endpoints
# 3. Should fail with 403
```

### A02: Cryptographic Failures
```bash
# Verify password hashing
grep -r "bcrypt\|argon2\|scrypt" server/
# Must use bcrypt with rounds >= 12

# Verify token hashing
grep -r "sha256\|sha512" server/auth/
# Password reset and email verification tokens must be hashed before storage

# Verify no plaintext secrets in code
grep -rn "password\|secret\|token\|key" --include="*.js" server/ | grep -v "process.env\|import\|export\|hash\|verify\|validate\|type\|name\|interface"
```

### A03: Injection
```bash
# SQL Injection — test every input
curl -s "http://localhost:3001/api/entities/Repository/filter" \
  -X POST -H "Content-Type: application/json" \
  -d '{"where": {"name": "'\'' OR 1=1 --"}}'
# Must return empty/error, NOT all rows

# XSS — test search and display
curl -s "http://localhost:5173/search?q=<script>alert(1)</script>"
# Must render as escaped text, not executed

# NoSQL Injection (if applicable)
curl -s "http://localhost:3001/api/auth/login" \
  -X POST -H "Content-Type: application/json" \
  -d '{"email": {"$gt": ""}, "password": "anything"}'
# Must reject with 400
```

### A04: Insecure Design
```bash
# Test rate limiting exists
for i in $(seq 1 10); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
# After 5-10 attempts, should see 429

# Test account lockout
# 5 failed logins should lock the account
```

### A05: Security Misconfiguration
```bash
# Check security headers
curl -sI http://localhost:3001/api/health | grep -i "x-content-type\|x-frame\|content-security\|strict-transport"

# Check error messages don't leak stack traces
curl -s http://localhost:3001/api/auth/login -X POST \
  -H "Content-Type: application/json" -d '{}'
# Response should NOT contain stack traces

# Check CORS
curl -sI -X OPTIONS http://localhost:3001/api/health \
  -H "Origin: https://evil.com"
```

### A06: Vulnerable Components
```bash
npm audit
# Should show 0 vulnerabilities
```

### A07: Authentication Failures
```bash
# Test enumeration prevention
curl -s http://localhost:3001/api/auth/password/reset-request \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"existing@user.com"}'
curl -s http://localhost:3001/api/auth/password/reset-request \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@user.com"}'
# Both should return identical response
```

### A08: Software and Data Integrity
```bash
# Check for eval() or Function() usage
grep -rn "eval(\|Function(\|setTimeout(\|setInterval(" --include="*.js" server/ src/

# Check for prototype pollution vectors
grep -rn "__proto__\|constructor\[" --include="*.js" src/

# Verify httpOnly cookies
grep -rn "httpOnly" server/auth/
```

### A09: Security Logging
```bash
# Verify audit logging exists for critical events
grep -rn "logAuditEvent" server/
# Should appear in: login, logout, register, password change, admin actions
```

### A10: SSRF
```bash
# Test URL input validation
curl -s http://localhost:3001/api/admin/repos/sync \
  -X POST -H "Content-Type: application/json" \
  -H "Cookie: <admin-session>" \
  -d '{"repo":"http://169.254.169.254/latest/meta-data/"}'
# Must NOT make internal network requests
```

---

## 2. Rate Limit Testing Protocol

```bash
# Login rate limit
for i in $(seq 1 15); do
  echo "Attempt $i: $(curl -s -o /dev/null -w '%{http_code}' \
    -X POST http://localhost:3001/api/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"test@test.com","password":"wrong","turnstileToken":"test"}')"
  sleep 0.5
done

# Password reset rate limit
for i in $(seq 1 15); do
  echo "Attempt $i: $(curl -s -o /dev/null -w '%{http_code}' \
    -X POST http://localhost:3001/api/auth/password/reset-request \
    -H 'Content-Type: application/json' \
    -d '{"email":"test@test.com"}')"
done

# Registration rate limit
for i in $(seq 1 10); do
  echo "Attempt $i: $(curl -s -o /dev/null -w '%{http_code}' \
    -X POST http://localhost:3001/api/auth/register \
    -H 'Content-Type: application/json' \
    -d '{"name":"Test","email":"test@test.com","password":"Pass123!","turnstileToken":"test","consent":true}')"
done
```

---

## 3. Session Security Checklist

| Check | Expected | Tool |
|---|---|---|
| Session cookie has `httpOnly: true` | ✓ | Browser DevTools |
| Session cookie has `secure: true` (in prod) | ✓ | curl -v |
| Session cookie has `sameSite: 'lax'` or `'strict'` | ✓ | Browser DevTools |
| Session ID is regenerated on login | ✓ | Compare before/after |
| Session destroyed on logout | ✓ | Check DB |
| No session fixation vulnerability | ✓ | Compare session ID before/after login |

---

## 4. Secrets Management

### Never in Code
```bash
# Scan for hardcoded secrets
grep -rn "ghp_\|sk-\|Bearer \|password.*=\|secret.*=" --include="*.js" src/ server/ | grep -v "process.env\|import\|export\|hash\|verify\|validate"
```

### Environment Variables
```bash
# Verify .env.local is in .gitignore
grep -q "env.local" .gitignore && echo "OK" || echo "MISSING"

# Verify no secrets in committed files
git log --all -p | grep -i "password\|secret\|token\|key" | grep -v "process.env\|import\|export\|hash\|verify"
```

---

## 5. Exploit Verification Protocol

For every finding:
1. **Reproduce** — demonstrate the vulnerability with a concrete attack
2. **Root Cause** — identify the exact code path
3. **Impact** — what data/systems are compromised
4. **Severity** — CVSS score or Critical/High/Medium/Low
5. **Remediation** — exact code fix
6. **Regression Test** — verify fix blocks the exploit

---

## 6. Openlysts-Specific Security Patterns

### Auth Token Storage
- Access tokens: httpOnly session cookie (not localStorage)
- Refresh tokens: server-side session store
- CSRF protection: SameSite cookie attribute

### API Endpoint Security Matrix
| Endpoint | Auth Required | Rate Limited | Input Validated |
|---|---|---|---|
| `POST /api/auth/register` | No | Yes | Zod schema |
| `POST /api/auth/login` | No | Yes | Manual check |
| `POST /api/auth/password/reset-request` | No | Yes | Manual check |
| `POST /api/auth/password/reset` | No | No ⚠️ | Zod schema |
| `GET /api/admin/*` | Yes + Admin | No ⚠️ | Parameterized SQL |
| `DELETE /api/admin/users/:id` | Yes + Admin | No | Manual check |
| `GET /api/entities/*` | No | No | Zod schema |
| `POST /api/entities/*` | Yes + Admin | No | Zod schema |

### Known Gaps (from Audit)
1. **No account lockout** — brute-force possible with IP rotation
2. **No rate limit on `/password/reset`** — token brute-force possible
3. **TOTP secret in setup response** — requires TLS interception to exploit
4. **In-memory rate limits** — reset on serverless cold start

---

## 7. Automated Security Scanning

### npm audit
```bash
npm audit --audit-level=high
```

### Static Analysis
```bash
npx eslint . --rule 'no-eval: error' --rule 'no-implied-eval: error'
```

### Strix Pentest (requires Docker)
```bash
npx strix install
npx strix scan http://localhost:5173
```

### Manual Penetration Test Checklist
- [ ] All CRUD endpoints tested with/without auth
- [ ] All inputs tested with XSS payloads
- [ ] All inputs tested with SQL injection payloads
- [ ] All inputs tested with path traversal
- [ ] Rate limiting verified on all public endpoints
- [ ] Session fixation tested
- [ ] CSRF tested on state-changing endpoints
- [ ] IDOR tested on user-specific resources
- [ ] Error responses verified to not leak internals
- [ ] CORS verified against arbitrary origins

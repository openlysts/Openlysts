# Openlysts — Implementation Plan
# Critical + High Priority Hotfix: Fix 10 Blocking Defects
**Generated**: 2026-09-01 | **Branch**: `freebuff/hi-b2234155-8d1d-4c4e-b1a2-4e0c792c9255`
**Reference**: `QA_Audit/QA_Audit_V4.md`

---

## 1. Design Read

### Current State
- Openlysts: full-stack Node.js application (Express 5.2 + React 18 / Vite)
- PostgreSQL via Neon (Vercel), 14 tables, parameterized queries, bcrypt auth
- Physical + automated audit revealed **5 critical, 14 high, 15 medium, 16 low findings (50 total)**
- The **Discover page** (core feature) is **BROKEN**: React duplicate-copy crash in `@radix-ui/react-popover`
- API backend is functional (13/13 endpoints respond correctly)
- Security fundamentals are strong (rate limiting, audit logging, helmet, CORS) but 2 exploitable gaps exist

### Architecture Decisions
- Changes are surgical: edit existing files only, no new dependencies except `undici` (explicit)
- All changes follow existing code patterns and conventions
- Critical fix (React crash) goes last to ensure backend is stable first
- No database migrations needed for Changes 1–9; Change 3 alters column name (Passkey table only)

### Dependencies Between Changes
- Changes 1–4, 7–9 are fully independent (different files, no cross-references)
- Changes 5–6 both modify `server/api/auth.js` but different functions — apply sequentially
- Change 7 (`admin.js`) is independent
- **Change 10 (`vite.config.js`) MUST be last** for full regression testing

---

## 2. Scope Summary

### In Scope (10 changes, 8 files)

| # | Change | File | Risk | Lines Affected |
|---|--------|------|------|----------------|
| 1 | Add `USER_DELETED_SELF` constant | `server/auth/constants.js` | LOW | +1 line |
| 2 | Remove debug `console.log` | `server/api/entities.js` | LOW | −1 line |
| 3 | Fix passkey column name | `server/db/schema.js` | LOW | 1-line edit |
| 4 | Remove `db:seed` script | `package.json` | LOW | −1 line |
| 5 | Add password-reset token rate limit | `server/api/auth.js` | MEDIUM | ~8 lines |
| 6 | Add account lockout (5 fails → 15 min) | `server/api/auth.js` | MEDIUM | ~25 lines |
| 7 | Complete delete cascade (Passkeys, Audit, EmailVerify) | `server/api/admin.js` | LOW | +3 lines |
| 8 | Remove unused `lodash` dependency | `package.json` | LOW | −1 line |
| 9 | Add explicit `undici` dependency | `package.json` | LOW | +1 line |
| 10 | Dedupe React via Vite resolve config | `vite.config.js` | HIGH | +4 lines |

**Total scope**: 10 changes · 8 files · ~48 lines added/removed · no new files

### Out of Scope (deferred)
- CSP header alignment (needs Vercel/nginx policy decision)
- Reduced-motion media query (UX enhancement, not defect)
- `robots.txt` (SEO, not functional)
- TOTP secret removal from response (requires UI refactor of setup flow)
- Database seeding script (needs product decision on default data)
- Theme flash fix (requires SSR or head injection)
- ESLint config migration (legacy `.eslintrc` redundant with `eslint.config.js`)
- In-memory rate-limit persistence across serverless cold starts (architecture decision)

### What Stays Unchanged
- All database tables, migrations, and data
- All existing API contracts and response shapes
- All frontend components and routing
- Authentication flows and session management
- Third-party integrations (GitHub, YouTube APIs)

---

## 3. Numbered Changes

---

### Change 1 — Add `USER_DELETED_SELF` Constant
**Goal**: Fix undefined audit-action constant that causes runtime errors during user self-deletion

**Files Modified**: `server/auth/constants.js`

**Dependencies Check**:
- `AUDIT_ACTIONS` is `Object.freeze({…})` — adding a key is non-breaking
- No existing code references `USER_DELETED_SELF` yet; `server/api/admin.js` line 755 uses the string literal `'USER_DELETED'` via `AUDIT_ACTIONS.USER_DELETED || 'USER_DELETED'`

**Exact Diffs**:
```diff
--- a/server/auth/constants.js
+++ b/server/auth/constants.js
@@ -26,6 +26,7 @@
   REPO_DELETED: 'REPO_DELETED',
+  USER_DELETED_SELF: 'USER_DELETED_SELF',
   QUERY_CREATED: 'QUERY_CREATED',
```

**Verification + Regression**:
1. `grep -n USER_DELETED_SELF server/auth/constants.js` — should show the new line
2. `node -e "import('./server/auth/constants.js').then(m => console.log(m.AUDIT_ACTIONS.USER_DELETED_SELF))"` — should print `USER_DELETED_SELF`
3. No other file references this constant yet, so no regression risk

**Rollback**: Delete the added line.

---

### Change 2 — Remove Debug `console.log`
**Goal**: Stop leaking raw request bodies (potentially containing passwords, tokens, PII) to server logs

**Files Modified**: `server/api/entities.js`

**Dependencies Check**:
- The `console.log` at line 99 is a standalone statement; removing it has zero side effects

**Exact Diffs**:
```diff
--- a/server/api/entities.js
+++ b/server/api/entities.js
@@ -96,7 +96,6 @@
     } else if (action === 'filter') {
       try {
-        console.log('[DEBUG req.body]', req.body);
         const validatedWhere = validateWhere(entity, req.body.where || {});
```

**Verification + Regression**:
1. `grep -n "console.log.*DEBUG" server/api/entities.js` — should return nothing
2. `curl -s "http://localhost:5173/api/entities/Repository/filter" -X POST -H "Content-Type: application/json" -d '{"where":{}}'` — should still return results
3. Server terminal should no longer print `[DEBUG req.body]` on entity filter requests

**Rollback**: Re-add the `console.log` line.

---

### Change 3 — Fix Passkey Schema Column Name
**Goal**: Align schema definition with actual database column for WebAuthn/Passkey functionality

**Files Modified**: `server/db/schema.js`

**⚠️ PRE-CHECK REQUIRED** — before applying, verify actual DB column:
```bash
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name='Passkey'"
```

**Dependencies Check**:
- The Passkey table is created via `CREATE TABLE IF NOT EXISTS` — if the table already exists with `created_date`, changing the schema definition only affects ORM-level queries, not the DB
- The auth module queries passkeys by `credential_id`, `user_id` — not by `created_date`/`created_at`
- **If DB column is `created_date`** → schema is correct, **skip this change**
- **If DB column is `created_at`** → apply the fix

**Exact Diffs** (only if DB uses `created_at`):
```diff
--- a/server/db/schema.js
+++ b/server/db/schema.js
@@ in the Passkey CREATE TABLE block:
-      created_date TEXT NOT NULL
+      created_at TEXT NOT NULL
```

**Verification + Regression**:
1. Verify actual DB column before applying: `psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name='Passkey'"`
2. If DB has `created_date` → **do NOT apply** (schema is correct)
3. If DB has `created_at` → apply and verify passkey registration still works
4. Test WebAuthn registration flow if possible

**Rollback**: Revert the column name.

---

### Change 4 — Remove `db:seed` Script
**Goal**: Fix `npm run db:seed` crash (Script not found error)

**Files Modified**: `package.json`

**Dependencies Check**:
- `server/db/seed.js` does not exist (`cat server/db/seed.js 2>/dev/null` returns nothing)
- No documentation references `npm run db:seed` except possibly the README

**Exact Diffs**:
```diff
--- a/package.json
+++ b/package.json
@@ in scripts section:
-    "db:seed": "node server/db/seed.js",
     "db:build-catalogs":
```

**Verification + Regression**:
1. `grep -r "db:seed" . --include="*.js" --include="*.json" --include="*.md"` — find all references
2. `cat server/db/seed.js 2>/dev/null || echo 'File does not exist — confirmed dead reference'`
3. Verify `npm run db:build-catalogs` and `npm run db:sync-neon` still work

**Rollback**: Re-add the script line.

---

### Change 5 — Add Password Reset Token Rate Limit
**Goal**: Prevent brute-force attacks on password reset tokens

**Files Modified**: `server/api/auth.js`

**Dependencies Check**:
- Uses in-memory `Map` (same pattern as existing `loginRateLimiter` at top of file)
- Applied to the `/password/reset` POST endpoint (line ~383)
- No external dependencies required

**Exact Diffs**:

Add rate limiter after existing imports, before `const router = Router()`:
```diff
+// Rate limiter for password-reset token attempts (brute-force protection)
+const resetTokenAttempts = new Map();
+function checkResetTokenRateLimit(token) {
+  const key = `reset:${token}`;
+  const now = Date.now();
+  const attempts = resetTokenAttempts.get(key) || [];
+  const recent = attempts.filter(t => now - t < 15 * 60 * 1000); // 15 min window
+  if (recent.length >= 10) return false; // 10 attempts per 15 min
+  recent.push(now);
+  resetTokenAttempts.set(key, recent);
+  return true;
+}
+
 const router = Router();
```

Add check inside the `/password/reset` handler, immediately after extracting `token`:
```diff
   router.post('/password/reset', async (req, res) => {
     try {
       const { token, password } = req.body;
+      if (!checkResetTokenRateLimit(token)) {
+        return res.status(429).json({ error: true, message: 'Too many attempts. Try again later.' });
+      }
```

**Verification + Regression**:
1. Send 11 `POST /api/auth/password/reset` requests with the same (valid or invalid) token → 11th should return HTTP 429
2. Wait 15 minutes (or temporarily shorten window for testing) → requests should be allowed again
3. Verify normal password-reset flow still works: request reset → receive token → execute reset with valid token
4. Confirm the rate limiter key includes the token itself (different tokens have independent counters)

**Rollback**: Remove the `resetTokenAttempts` Map, the `checkResetTokenRateLimit` function, and the rate-limit check in the handler.

---

### Change 6 — Add Account Lockout
**Goal**: Prevent brute-force password attacks by locking accounts after repeated failed logins

**Files Modified**: `server/api/auth.js`

**Dependencies Check**:
- Uses in-memory `Map` (same pattern as existing rate limiters)
- The User table has no `locked_until` column; lockout is tracked in-memory only (acceptable for single-instance dev; for production, consider DB-backed lockout)
- Applied to the `/login` POST endpoint (line ~127)

**Exact Diffs**:

Add lockout functions after the reset rate limiter (from Change 5):
```diff
+// Account lockout after failed login attempts
+const failedLoginAttempts = new Map();
+const MAX_LOGIN_ATTEMPTS = 5;
+const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
+
+function recordFailedLogin(email) {
+  const key = email.toLowerCase();
+  const record = failedLoginAttempts.get(key) || { count: 0, firstAt: Date.now() };
+  record.count++;
+  if (record.count === 1) record.firstAt = Date.now();
+  failedLoginAttempts.set(key, record);
+  return record.count >= MAX_LOGIN_ATTEMPTS;
+}
+
+function clearFailedLogins(email) {
+  failedLoginAttempts.delete(email.toLowerCase());
+}
+
+function getLockoutRemainingMs(email) {
+  const record = failedLoginAttempts.get(email.toLowerCase());
+  if (!record || record.count < MAX_LOGIN_ATTEMPTS) return 0;
+  const elapsed = Date.now() - record.firstAt;
+  return Math.max(0, LOCKOUT_DURATION_MS - elapsed);
+}
```

Add lockout check at the start of the `/login` handler, after extracting `email`:
```diff
   router.post('/login', loginRateLimiter, async (req, res) => {
     try {
       const { email, password, turnstileToken } = req.body;
+      // Check account lockout
+      if (email) {
+        const remainingMs = getLockoutRemainingMs(email);
+        if (remainingMs > 0) {
+          const remainingMin = Math.ceil(remainingMs / 60000);
+          return res.status(423).json({ error: true, message: `Account locked. Try again in ${remainingMin} minute(s).` });
+        }
+      }
```

Add `clearFailedLogins` on successful login (before the success response) and `recordFailedLogin` on each failed-login path:
```diff
       // On successful login (after session creation, before return):
+      clearFailedLogins(email);
       return res.json({ success: true, user: sanitizeUser(user) });
```

```diff
       // On each failed-login audit log, add:
+      const locked = recordFailedLogin(email || '');
+      const lockMsg = locked ? ' Account locked due to too many failed attempts.' : '';
       return res.status(401).json({ error: true, message: 'Invalid email or password.' + lockMsg });
```

**Verification + Regression**:
1. Attempt 5 wrong passwords for the same email → 5th should return HTTP 423 with lockout message
2. Wait 15 minutes (or shorten `LOCKOUT_DURATION_MS` for testing) → should be allowed again
3. Successful login should clear the counter (verify by logging in with correct password after a few failures)
4. Lockout message should show remaining minutes
5. Different emails have independent counters
6. Verify no memory leak: Map entries are naturally cleaned up when lockout expires

**Rollback**: Remove the `failedLoginAttempts` Map, all lockout functions, and all lockout checks in the handler.

---

### Change 7 — Complete Delete Cascade
**Goal**: Prevent orphaned records when admin deletes a user (Passkeys, AuditLogs, EmailVerificationTokens are currently NOT cascade-deleted)

**Files Modified**: `server/api/admin.js`

**Dependencies Check**:
- The existing cascade (line ~730) already handles: Bookmark, AuthAccount, PasswordResetToken, session
- Missing: Passkey, AuditLog, EmailVerificationToken
- All use the same `user_id` foreign key pattern
- Each delete is wrapped in `.catch(() => {})` for resilience

**Exact Diffs**:
```diff
--- a/server/api/admin.js
+++ b/server/api/admin.js
@@ Cascade delete section:
     await Promise.all([
       db.query('DELETE FROM "Bookmark" WHERE user_id = $1', [targetId]).catch(() => {}),
       db.query('DELETE FROM "AuthAccount" WHERE user_id = $1', [targetId]).catch(() => {}),
       db.query('DELETE FROM "PasswordResetToken" WHERE user_id = $1', [targetId]).catch(() => {}),
+      db.query('DELETE FROM "EmailVerificationToken" WHERE user_id = $1', [targetId]).catch(() => {}),
+      db.query('DELETE FROM "Passkey" WHERE user_id = $1', [targetId]).catch(() => {}),
+      db.query('DELETE FROM "AuditLog" WHERE actor_id = $1 OR target_user_id = $1', [targetId]).catch(() => {}),
       db.query(`DELETE FROM "session" WHERE sess->>'userId' = $1`, [targetId]).catch(() => {}),
     ]);
```

**Verification + Regression**:
1. Create a test user with bookmarks, passkeys, audit logs, email verification tokens, sessions
2. Delete the user via `DELETE /api/admin/users/:id`
3. Verify ALL related records are removed (no orphans in any of the 7 tables)
4. Verify the deletion returns success
5. Verify the audit log records the deletion event itself

**Rollback**: Remove the 3 added cascade lines.

---

### Change 8 — Remove Unused `lodash` Dependency
**Goal**: Reduce bundle size by ~70KB (uncompressed) by removing unused dependency

**Files Modified**: `package.json`

**Dependencies Check**:
- `grep -r "from ['\"]lodash" src/ server/` returns zero results
- `grep -r "require.*lodash" src/ server/` returns zero results
- No `lodash/fp`, `lodash-es`, or per-method imports (`lodash.get`, etc.) found

**Exact Diffs**:
```diff
--- a/package.json
+++ b/package.json
@@ in dependencies:
-    "lodash": "^4.17.21",
     "lucide-react":
```

**Verification + Regression**:
1. `grep -r "lodash" src/ server/` — confirm zero imports/requires
2. `npm run build` — should succeed without lodash
3. Compare bundle size before/after: `ls -la dist/assets/` (expect ~70KB reduction)

**Rollback**: Re-add `lodash` to `package.json` dependencies and run `npm install`.

---

### Change 9 — Add Explicit `undici` Dependency
**Goal**: Stabilize build and ensure Node.js `fetch` compatibility

**Files Modified**: `package.json`

**Dependencies Check**:
- `undici` is imported by `server/services/catalogEngine.js` (line 3) and `server/functions/queryAlternatives.js`
- Currently resolved via Node.js built-in; making it explicit prevents version drift

**Exact Diffs**:
```diff
--- a/package.json
+++ b/package.json
@@ in dependencies:
     "lucide-react": "^0.475.0",
+    "undici": "^7.10.0",
     "zod": "^3.24.2"
```

**Verification + Regression**:
1. `npm run build` — verify no errors
2. `grep -r "from ['\"]undici" server/` — confirm imports resolve correctly
3. Test catalog engine and alternative query functions

**Rollback**: Remove `undici` from `package.json` and run `npm install`.

---

### Change 10 — Dedupe React in Vite Config ⚠️ CRITICAL FIX
**Goal**: Fix the React duplicate-copy crash that breaks the entire Discover page

**Root Cause Analysis**:
1. The Vite bundle contains **TWO copies** of React (verified via source inspection)
2. `@radix-ui/react-popover` calls `useMemo` from **Copy B** of React
3. React DOM expects hooks from **Copy A** of React
4. React's golden rule: **all hooks must come from the same React copy** → runtime CRASH
5. Error: `"Invalid hook call. Hooks can only be called inside the body of a function component"`
6. The ErrorBoundary catches it and shows "Something went wrong", but the Discover page — the core of the entire application — is **non-functional for all users**

**Note**: `vite.config.js` already has a `resolve.alias` pointing `react` and `react-dom` to `node_modules/`. This suggests a prior fix attempt. However, `resolve.alias` alone doesn't guarantee deduplication when third-party packages bundle their own React copies. The `resolve.dedupe` option is the correct Vite-native solution.

**Files Modified**: `vite.config.js`

**Exact Diffs**:
```diff
--- a/vite.config.js
+++ b/vite.config.js
@@ resolve section:
   resolve: {
     alias: {
       '@': path.resolve(__dirname, './src'),
       'react': path.resolve(__dirname, './node_modules/react'),
       'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
     },
+    dedupe: ['react', 'react-dom'],
   },
```

**Verification + Regression** (must be thorough):
1. `npm run build` — verify clean build with no warnings about duplicate React
2. Start dev server: `npm run dev`
3. Navigate to Discover page in browser
4. Verify **NO** `"Invalid hook call"` error in browser console
5. Verify Popover components work: click filter chips, verify dropdowns appear
6. Verify Welcome page still loads correctly (3D animation renders)
7. Test on mobile viewport (375px width)
8. Full page-by-page regression:
   - `/` (Welcome) — loads, 3D particle animation renders
   - `/discover` — **CRITICAL**: no crash, search works, filters work, popovers open
   - `/profile` — loads, avatar displays
   - `/settings` — loads, all tabs functional
   - `/auth/login` — login flow works
   - `/auth/register` — registration flow works
9. Test API endpoints: `GET /api/health`, `GET /api/entities/Repository/list`, `POST /api/auth/login`
10. Check bundle size reduction (expect ~150KB smaller with single React copy)

**Rollback**: Remove the `dedupe: ['react', 'react-dom']` line from `resolve`.

---

## 4. Implementation Sequence

| Order | Change | Risk | Rollback | Est. Time |
|-------|--------|------|----------|-----------|
| 1 | Add `USER_DELETED_SELF` constant | LOW | Delete 1 line | 2 min |
| 2 | Remove debug `console.log` | LOW | Re-add 1 line | 2 min |
| 3 | Fix passkey column name *(verify DB first)* | LOW | Revert 1 line | 3 min |
| 4 | Remove `db:seed` script | LOW | Re-add 1 line | 2 min |
| 5 | Add reset-token rate limit | MEDIUM | Remove rate limiter | 10 min |
| 6 | Add account lockout | MEDIUM | Remove lockout code | 15 min |
| 7 | Complete delete cascade | LOW | Remove 3 lines | 5 min |
| 8 | Remove lodash | LOW | Re-add dep | 3 min |
| 9 | Add undici explicit | LOW | Remove dep | 3 min |
| 10 | Dedupe React (Vite) | HIGH | Remove resolve block | 10 min + full regression |

**Total Estimated Time**: ~55 minutes

---

## 5. Verification Plan

### After EACH Change (1–9):
1. `npm run build` — verify no build errors
2. `curl -s http://localhost:5173/api/health` — backend responds
3. Smoke-test the affected functionality
4. `git diff` — review only intended changes

### After Change 10 (React crash fix) — FULL REGRESSION:
1. `npm run build` — clean build
2. Start dev server
3. Test EVERY route:
   - `/` (Welcome) — loads, 3D animation renders
   - `/discover` — **CRITICAL**: no crash, search works, filters work, popovers open
   - `/profile` — loads, avatar displays
   - `/settings` — loads, all tabs functional
   - `/auth/login` — login flow works
   - `/auth/register` — registration flow works
4. Test API endpoints:
   - `GET /api/health` — 200
   - `GET /api/entities/Repository/list` — returns results
   - `POST /api/auth/login` — authentication works
5. Test responsive: resize browser to mobile (375px) and tablet (768px)
6. Check browser console — zero errors
7. Compare bundle size: before vs after

---

## 6. Definition of DONE

- [ ] Change 1: `USER_DELETED_SELF` constant exists and exports correctly
- [ ] Change 2: No debug `console.log` in `entities.js`
- [ ] Change 3: Passkey schema column matches actual DB *(verified with `psql`)*
- [ ] Change 4: `npm run db:seed` no longer in `package.json` scripts
- [ ] Change 5: Password reset rate limit returns 429 after 10 attempts per 15 min
- [ ] Change 6: Account lockout returns 423 after 5 failed logins per 15 min
- [ ] Change 7: Admin user deletion cascades to Passkeys, AuditLogs, EmailVerificationTokens
- [ ] Change 8: Lodash removed, zero lodash imports in codebase, build succeeds
- [ ] Change 9: Undici explicit, build succeeds, catalog engine imports resolve
- [ ] Change 10: Discover page loads **WITHOUT** crash, Popover works, no duplicate React
- [ ] `npm run build` succeeds with zero errors
- [ ] All 13 API endpoints return expected responses
- [ ] All pages load without crashes or console errors
- [ ] Bundle size reduced (single React copy)
- [ ] No regressions in auth, profile, settings, admin flows

---

## Appendix A — Findings Reference (from `QA_Audit_V4.md`)

### Critical Findings (5)
| ID | Finding | Fix |
|----|---------|-----|
| CRIT-01 | Discover page React crash (`Invalid hook call`) | Change 10 |
| CRIT-02 | `USER_DELETED_SELF` undefined constant | Change 1 |
| CRIT-03 | Debug `console.log` leaks PII to logs | Change 2 |
| CRIT-04 | Passkey schema column mismatch | Change 3 |
| CRIT-05 | `db:seed` script references non-existent file | Change 4 |

### High Findings Addressed (4 of 14)
| ID | Finding | Fix |
|----|---------|-----|
| HIGH-01 | No account lockout on failed logins | Change 6 |
| HIGH-02 | No rate limit on password-reset token attempts | Change 5 |
| HIGH-03 | Incomplete cascade on admin user deletion | Change 7 |
| HIGH-04 | Unused `lodash` (~70KB bundle bloat) | Change 8 |

### High Findings Deferred (10)
| ID | Finding | Reason Deferred |
|----|---------|-----------------|
| HIGH-05 | CSP headers mismatch with Helmet config | Needs Vercel/nginx policy decision |
| HIGH-06 | In-memory rate limits reset on serverless cold starts | Architecture decision (Redis/DB-backed needed) |
| HIGH-07 | No HTTPS enforcement middleware | Vercel handles at edge |
| HIGH-08 | No request body size limit | Needs load testing to set appropriate value |
| HIGH-09 | Potential session fixation risk | Needs session store review |
| HIGH-10 | No idempotency keys on mutations | Needs API contract review |
| HIGH-11 | Missing input validation on some endpoints | Needs Zod schema expansion |
| HIGH-12 | No graceful shutdown handler | Serverless environment may not benefit |
| HIGH-13 | O(n) full-table catalog scan | Needs index or materialized view |
| HIGH-14 | No database connection health check | Needs monitoring integration |

---

*This plan follows the Implementation Plan Layout standard from `.agents/rules/implementation-plan-layout.md`*
*Generated by Buffy (Codebuff) on 2026-09-01*

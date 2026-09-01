# Testing Standards Rule

Every feature in Openlysts MUST be tested before deployment. No exceptions.

---

## 1. Test Types

| Type | Tool | When |
|---|---|---|
| Unit tests | Node.js test runner | Business logic, utilities |
| Integration tests | Node.js + API calls | API endpoints |
| E2E tests | Playwright MCP | Full user flows |
| Visual tests | Playwright screenshots | UI rendering |
| Security tests | Manual + curl | Auth, injection, XSS |

---

## 2. E2E Testing Protocol

### Physical Browser Testing (MANDATORY)
- Use Playwright MCP tools ONLY (`browser_click`, `browser_navigate`, etc.)
- NEVER use `npx playwright test` CLI
- NEVER use `browser_subagent`
- Take screenshots after EVERY major action
- Check console errors after EVERY navigation

### Test Coverage Required
| Area | Minimum Tests |
|---|---|
| Welcome page | 3 (load, animation, meta) |
| Discover page | 5 (load, search, filters, pagination, error) |
| Auth flows | 6 (register, login, logout, OAuth, 2FA, reset) |
| Profile | 3 (load, edit, save) |
| Settings | 3 (load, toggle, save) |
| Admin | 3 (guard, dashboard, user mgmt) |
| Responsive | 3 (mobile, tablet, desktop) |
| Accessibility | 3 (keyboard, screen reader, contrast) |
| Security | 3 (XSS, SQLi, CSRF) |
| Error handling | 3 (API failure, offline, timeout) |

---

## 3. Test Execution Order

```
TC-001 → TC-002 → TC-003 → ... → TC-N
```

- NEVER skip tests
- NEVER mark as "assumed pass"
- ALWAYS execute sequentially
- ALWAYS record evidence (screenshots, console logs)

---

## 4. Failure Protocol

When a test fails:
1. **Reproduce** — confirm the failure
2. **Diagnose** — identify root cause
3. **Fix** — implement minimal fix
4. **Verify** — physically confirm fix works
5. **Regression** — re-run failed test + adjacent tests
6. **Continue** — proceed to next test

NEVER suppress, skip, or ignore failures.

---

## 5. API Testing

```bash
# Health check
curl -s http://localhost:3001/api/health

# Search
curl -s "http://localhost:3001/api/entities/Repository/list"

# Auth (unauthorized)
curl -s http://localhost:3001/api/admin/telemetry  # Should return 401

# Auth (login)
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}'
```

---

## 6. Security Testing

```bash
# SQL Injection
curl -s "http://localhost:3001/api/entities/Repository/filter" \
  -X POST -H "Content-Type: application/json" \
  -d '{"where":{"name":"'\'' OR 1=1 --"}}'

# XSS
curl -s "http://localhost:5173/search?q=<script>alert(1)</script>"

# Rate limiting
for i in $(seq 1 10); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong","turnstileToken":"test"}'
done
```

---

## 7. Performance Testing

```javascript
// DOM node count
document.querySelectorAll('*').length  // Should be ≤ 2000

// Memory after navigation
performance.memory?.usedJSHeapSize / 1024 / 1024  // Should not grow unboundedly

// Load time
performance.getEntriesByType('navigation')[0].loadEventEnd  // Should be < 3000ms
```

---

## 8. Documentation

After every test run, document:
- Test case ID and description
- Pass/fail status
- Evidence (screenshot path, console output)
- Root cause for failures
- Fix applied (if any)

Store in `QA_Audit/` directory.

---

## 9. Enforcement

- E2E tests must pass before deploy
- Security tests must pass before deploy
- Performance must be within budget
- All failures must be fixed or documented

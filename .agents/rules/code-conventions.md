# Code Conventions Rule

Every code file in Openlysts MUST follow these conventions. No exceptions.

## File Organization

### JavaScript/JSX Files
```javascript
// 1. Imports (grouped, sorted)
import { Router } from 'express';          // External packages
import { db } from '../db/index.js';        // Internal modules
import { ROLES } from '../auth/constants.js'; // Project constants

// 2. Constants
const MAX_RETRIES = 3;

// 3. Exported functions/classes
export async function myFunction(req, res) { }

// 4. Internal helpers
function helperFunction() { }

// 5. Default export (for route files)
export default router;
```

### Import Order (enforced)
1. External packages (`express`, `react`, `zod`)
2. Node built-ins (`crypto`, `path`, `fs`)
3. Internal modules (`../db/`, `../auth/`, `../services/`)
4. Constants (`../auth/constants.js`)
5. Types (if TypeScript)

**NEVER** mix import groups or use random ordering.

---

## Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `RepoCard.jsx`, `DiscoverPage.jsx` |
| Files (utilities) | camelCase | `api.js`, `syncOutbox.js` |
| Files (server routes) | camelCase | `auth.js`, `admin.js`, `entities.js` |
| Functions | camelCase | `searchEntities()`, `hashPassword()` |
| React Components | PascalCase | `RepoCard`, `ErrorBoundary` |
| Constants | UPPER_SNAKE_CASE | `MAX_ATTEMPTS`, `AUDIT_ACTIONS` |
| DB tables | PascalCase (quoted) | `"Repository"`, `"User"` |
| DB columns | snake_case | `created_date`, `user_id` |
| CSS classes | Tailwind utility | `className="text-sm font-bold"` |
| CSS variables | kebab-style | `--background`, `--foreground` |

---

## Comment Standards

### When to Comment
```javascript
// GOOD: Explain WHY, not WHAT
// Neon serverless requires small pool sizes to avoid connection limits
const pool = new Pool({ max: 5 });

// GOOD: Complex business logic
// Rate limit uses sliding window: 5 attempts per 15 minutes
// Resets when lockout expires
function checkRateLimit(key) { }

// BAD: Restating the code
// Delete the user
await db.delete(user);  // DON'T DO THIS
```

### Comment Format
```javascript
// ─── Section Header ─────────────────────────────────────────────────
// Descriptive section comment

// Inline comment for non-obvious logic
const result = await query(); // Silent fail for non-critical operation
```

### JSDoc for Exported Functions
```javascript
/**
 * Search repositories by keyword with pagination.
 * @param {string} query - Search term
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Results per page (max 100)
 * @returns {Promise<{repos: Array, total: number}>}
 */
export async function searchRepos(query, page = 1, limit = 20) { }
```

---

## Logging Standards

### Log Levels
| Level | When | Format |
|---|---|---|
| `console.error` | Failures, exceptions | `[SERVICE] Function failed: message` |
| `console.warn` | Non-critical issues | `[SERVICE] Warning: message` |
| `console.log` | Dev-only debugging | `[DEV] message` (wrap in `if (dev)`) |

### Log Format
```javascript
// ALWAYS include service prefix
console.error('[AUTH] Login error:', err.message);
console.error('[DB] Migration failed:', e.message);
console.error('[ADMIN] Telemetry error:', err.message);

// NEVER log sensitive data
console.log(user.password);     // BAD
console.log(user.email);        // OK (non-sensitive identifier)
console.log(req.body);          // BAD (may contain passwords)
```

### Forbidden Logs in Production
- `console.log(req.body)` — may contain passwords, tokens
- `console.log(password)` — secrets
- `console.log(sessionID)` — session fixation risk
- `console.log(token)` — token leakage

---

## Formatting Rules

### Indentation
- 2 spaces (enforced by ESLint)
- No tabs

### Semicolons
- Always use semicolons (enforced by ESLint)

### Quotes
- Single quotes for strings: `'hello'`
- Template literals for interpolation: `` `${name}` ``

### Trailing Commas
- Always use trailing commas (enforced by ESLint)

### Line Length
- Max 100 characters (soft limit)
- Break long chains/methods onto separate lines

---

## Forbidden Patterns

```javascript
// NEVER use var
var x = 1;  // BAD

// NEVER use == / !=
if (x == null) { }  // BAD
if (x === null) { }  // GOOD

// NEVER use eval() or Function()
eval(userInput);  // SECURITY RISK
new Function(code);  // SECURITY RISK

// NEVER use process.exit() in serverless
process.exit(1);  // BAD in Vercel functions

// NEVER hardcode secrets
const API_KEY = 'sk-12345';  // BAD
const API_KEY = process.env.API_KEY;  // GOOD

// NEVER suppress errors silently
try { await riskyOp(); } catch (e) { }  // BAD
try { await riskyOp(); } catch (e) { console.error(e); }  // GOOD
```

---

## Enforcement

- ESLint config (`eslint.config.js`) enforces most rules
- `npm run lint` must pass before commit
- `npm run lint:fix` for auto-fixable issues

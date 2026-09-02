# Git Push Workflow — Openlysts

## Remote Setup

| Remote | URL | Purpose |
|--------|-----|---------|
| `origin` | `https://github.com/openlysts/Openlysts.git` | **Primary repo** — production code |

**No backup remote.** Only one git account, one remote.

## Branch Strategy

```
experimental → dev → main
     ↑           ↑       ↑
  Development  Staging  Production
```

| Branch | Purpose | Push Default |
|--------|---------|-------------|
| `experimental` | Feature development, active work | ✅ **Always** (default push target) |
| `dev` | Integration testing | Only when user says "all branches" |
| `main` | Production deploy | Only when user says "all branches" |

## Push Rules — The Golden Rule

### Default: Push to `experimental` ONLY

When user says **"push to git"**, **"push it"**, or any generic push command:

```
git push origin experimental
```

That's it. Only `experimental`. Nothing else.

### Explicit: Push to ALL branches

**ONLY** when user explicitly says **"push to all branches"**, **"sync all branches"**, or **"push to main too"**:

```
# 1. Push experimental
git push origin experimental

# 2. Merge to dev
git checkout dev
git merge experimental --ff-only
git push origin dev

# 3. Merge to main
git checkout main
git merge dev --ff-only
git push origin main

# 4. Return to experimental
git checkout experimental
```

### Push to specific branch

When user says **"push to main"** or **"push to dev"**:

```
git push origin <branch-name>
```

## User Command Mapping

| User Command | Action |
|-------------|--------|
| "Push to git" | `git push origin experimental` |
| "Push it" | `git push origin experimental` |
| "Push to experimental" | `git push origin experimental` |
| "Push to all branches" | Push experimental → merge+push dev → merge+push main |
| "Sync all branches" | Same as "push to all branches" |
| "Push to main" | `git push origin main` |
| "Push to dev" | `git push origin dev` |

## Push Protocol

### Step 1: Pre-Push Checks
```bash
# Always verify before pushing
npm run build         # Build succeeds
npm run typecheck     # Type safety (if applicable)
npm run lint          # Code quality (if applicable)
```

### Step 2: Commit with Conventional Format
```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build
```

### Step 3: Push
```bash
git push origin experimental
```

### Step 4: If All Branches Requested
```bash
# Merge chain: experimental → dev → main
git checkout dev && git merge experimental --ff-only && git push origin dev
git checkout main && git merge dev --ff-only && git push origin main
git checkout experimental
```

## Safety Rules

1. **Never force push to `main`** — unless explicitly authorized
2. **Always verify build passes** before pushing to `main`
3. **Always run tests** before pushing to `dev`
4. **Commit before push** — never push unstaged changes
5. **Check branch** — confirm which branch before pushing
6. **Default is experimental** — never push to dev/main without explicit request
7. **No Co-Authored-By lines** — commits show only the account holder's name

## Forbidden

- NEVER add `Co-Authored-By: Codebuff` or any bot attribution to commits
- NEVER add `Generated with Codebuff` or similar footers
- NEVER push to `main` without explicit user permission
- NEVER push to `dev` without explicit user permission
- NEVER force push without explicit authorization
- NEVER commit `.env`, secrets, or credentials

## Emergency Rollback

```bash
# Rollback last commit (keep changes local)
git reset --soft HEAD~1

# Rollback to specific commit
git reset --hard <commit-hash>

# Push rollback
git push origin experimental --force-with-lease
```

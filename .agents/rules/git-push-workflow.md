# Git Push Workflow — Openlysts

## Remote Setup

| Remote | URL | Purpose |
|--------|-----|---------|
| `origin` | `https://github.com/openlysts/Openlysts.git` | **Primary repo** — production code |
| `backup` | `https://github.com/sheenhatt/openlysts_backup.git` | **Backup repo** — safety net |

## Branch Strategy

```
experimental → dev → main
     ↓          ↓       ↓
  feature     integration  production
  development  testing     deploy
```

| Branch | Purpose | Push to Origin | Push to Backup |
|--------|---------|----------------|----------------|
| `experimental` | Feature development, active work | ✅ After testing | ✅ When stable |
| `dev` | Integration testing | ✅ After experimental passes | ✅ When stable |
| `main` | Production deploy | ✅ Only when fully tested | ✅ Always (safety) |

## Push Rules

### When User Says "Push to Git"

**Default behavior:** Push to `origin` (primary repo) on the specified branch.

### When User Says "Push to Backup"

**Behavior:** Push to `backup` remote on the specified branch.

### When User Says "Push to All Branches"

**Behavior:** Push current branch to `origin`, then push `main`, `dev`, and `experimental` to `backup`.

## Push Protocol

### Step 1: Pre-Push Checks
```bash
# Always verify before pushing
npm run lint          # Code quality
npm run typecheck     # Type safety
npm run build         # Build succeeds
```

### Step 2: Commit with Conventional Format
```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build
```

### Step 3: Push to Origin
```bash
git push origin <branch>
```

### Step 4: Push to Backup (if requested)
```bash
git push backup <branch>
```

## User Command Mapping

| User Command | Action |
|-------------|--------|
| "Push to git" | `git push origin <current-branch>` |
| "Push to main" | `git push origin main` |
| "Push to dev" | `git push origin dev` |
| "Push to experimental" | `git push origin experimental` |
| "Push to all branches" | Push current to origin + push main/dev/experimental to backup |
| "Push to backup" | `git push backup <current-branch>` |
| "Push everything to backup" | Push main + dev + experimental to backup |
| "Deploy" | Push to origin main + trigger Vercel deploy |

## Safety Rules

1. **Never force push to main** — unless explicitly authorized
2. **Always verify build passes** before pushing to main
3. **Always run tests** before pushing to dev
4. **Commit before push** — never push unstaged changes
5. **Check branch** — confirm which branch before pushing
6. **Log the push** — record what was pushed and where

## Emergency Rollback

```bash
# Rollback last commit (keep changes local)
git reset --soft HEAD~1

# Rollback to specific commit
git reset --hard <commit-hash>

# Push rollback to origin
git push origin <branch> --force-with-lease

# Push rollback to backup
git push backup <branch> --force-with-lease
```

## Backup Sync Schedule

| Trigger | Action |
|---------|--------|
| After major feature merge | Push to backup |
| Before production deploy | Push to backup |
| Weekly (Monday) | Auto-sync main to backup |
| Before destructive changes | Always backup first |

# Git Workflow Standards Rule

Every Git operation in Openlysts MUST follow these standards. No exceptions.

---

## 1. Branch Strategy

```
experimental → dev → main → backup
     ↑           ↑       ↑        ↑
  Development  Staging  Prod   Rollback
```

| Branch | Purpose | Deploy | Merge Direction |
|---|---|---|---|
| `experimental` | Active development | None | → dev |
| `dev` | Staging | Vercel preview | → main |
| `main` | Production | Vercel production | → backup |
| `backup` | Disaster recovery | None | ← main only |

---

## 2. Commit Messages

### Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
| Type | When |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Maintenance, deps, config |
| `docs` | Documentation only |
| `refactor` | Code restructuring (no feature change) |
| `test` | Adding tests |
| `style` | Formatting, no code change |
| `perf` | Performance improvement |
| `ci` | CI/CD changes |
| `revert` | Reverting a commit |

### Examples
```
feat(auth): add account lockout after 5 failed logins
fix(discover): resolve React duplicate-copy crash in Popover
chore(deps): remove unused lodash dependency
docs(readme): update setup instructions
refactor(api): extract rate limiter to shared module
```

### Rules
- Use imperative mood: "add" not "added"
- Keep subject line under 72 characters
- Reference issue numbers when applicable: `fix(auth): resolve #123`
- NEVER use generic messages: "update", "fix", "changes"

---

## 3. Pre-Commit Checklist

```bash
# 1. Build passes
npm run build

# 2. Lint passes
npm run lint

# 3. No console.log in production code
grep -rn "console.log" server/ src/ | grep -v "console.error\|console.warn\|if.*dev"

# 4. No secrets committed
git diff --cached | grep -i "password\|secret\|token\|key" | grep -v "process.env"
```

---

## 4. Deployment Protocol

### Deploy to Production
```bash
# 1. Commit on experimental
git add .
git commit -m "feat/fix: description"
git push origin experimental

# 2. Sync all branches
git checkout dev
git merge experimental --ff-only || git merge experimental
git push origin dev

git checkout main
git merge dev --ff-only || git merge dev
git push origin main

git checkout backup
git merge main --ff-only || git merge main
git push origin backup

# 3. Deploy from main
git checkout main
npx vercel --prod --yes --force

# 4. Verify
curl -s https://openlysts.vercel.app/api/health

# 5. Return to working branch
git checkout experimental
```

### Rollback
```bash
git checkout main
git revert HEAD
git push origin main
npx vercel --prod --yes --force
git checkout experimental
```

---

## 5. Tagging

```bash
# Tag major releases
git tag v1.0.0
git push origin v1.0.0
```

### Version Scheme
- `v1.0.0` — Major (breaking changes)
- `v1.1.0` — Minor (new features)
- `v1.1.1` — Patch (bug fixes)

---

## 6. Forbidden

- NEVER force-push to `main` or `backup`
- NEVER commit directly to `main`
- NEVER commit `.env`, `.env.local`, or secrets
- NEVER commit `node_modules/` or `dist/`
- NEVER use `git add .` without reviewing changes
- NEVER merge broken code into `dev` or `main`

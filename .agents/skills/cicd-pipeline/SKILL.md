---
name: cicd-pipeline
description: "CI/CD and deployment pipeline skill for Openlysts. Covers automated testing, build verification, Vercel deployment, environment management, rollback procedures, and deployment safety."
---

# CI/CD & Pipeline Skill

## Role & Identity
DevOps Engineer ensuring every code change is tested, verified, and safely deployed. Zero tolerance for broken deploys.

---

## 1. Deployment Branch Strategy

```
experimental → dev → main → backup
     ↑           ↑       ↑        ↑
  Development  Staging  Prod   Rollback
```

### Branch Rules
| Branch | Purpose | Auto-Deploy | Tests Required |
|---|---|---|---|
| `experimental` | Active development | No | None |
| `dev` | Staging | Vercel preview | Build + lint |
| `main` | Production | Vercel production | Full test suite |
| `backup` | Disaster recovery | No | None |

---

## 2. Pre-Deployment Checklist

### Local Verification (Before Commit)
```bash
# 1. Build
npm run build

# 2. Lint
npm run lint

# 3. Typecheck
npm run typecheck

# 4. Run tests
npm test

# 5. Manual smoke test
npm run dev
# Visit http://localhost:5173, test critical flows
```

### Commit Protocol
```bash
git add .
git commit -m "feat/fix/chore: <clear summary>"
git push origin experimental
```

---

## 3. Deployment Protocol

### Step 1: Sync All Branches
```bash
# dev
git checkout dev
git merge experimental --ff-only || git merge experimental -m "Merge experimental into dev"
git push origin dev

# main
git checkout main
git merge dev --ff-only || git merge dev -m "Merge dev into main"
git push origin main

# backup
git checkout backup
git merge main --ff-only || git merge main -m "Merge main into backup"
git push origin backup
```

### Step 2: Deploy from main
```bash
git checkout main
npx vercel --prod --yes --force
```

### Step 3: Post-Deployment Verification
```bash
# 1. Health check
curl -s https://openlysts.vercel.app/api/health

# 2. Critical routes
curl -s https://openlysts.vercel.app/ | head -5
curl -s https://openlysts.vercel.app/discover | head -5

# 3. API endpoints
curl -s https://openlysts.vercel.app/api/entities/Repository/list | head -5
```

### Step 4: Return to Working Branch
```bash
git checkout experimental
```

---

## 4. Environment Variables

### Required for Production
| Variable | Purpose | Required |
|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection | ✓ |
| `SESSION_SECRET` | Session signing secret | ✓ |
| `GITHUB_CLIENT_ID` | GitHub OAuth | Optional |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth | Optional |
| `GOOGLE_CLIENT_ID` | Google OAuth | Optional |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | Optional |
| `GITHUB_TOKEN` | GitHub API rate limits | Optional |
| `SMTP_HOST` | Email delivery | Optional |
| `TURNSTILE_SECRET_KEY` | Bot protection | Optional |

### Environment Sync
```bash
# Pull production env locally
vercel env pull .env.local --environment production

# Never commit .env.local
echo ".env.local" >> .gitignore
```

---

## 5. Rollback Procedure

### Quick Rollback (Revert Last Deploy)
```bash
git checkout main
git revert HEAD
git push origin main
npx vercel --prod --yes --force
git checkout experimental
```

### Full Rollback (Restore backup)
```bash
git checkout main
git reset --hard backup
git push origin main --force-with-lease
npx vercel --prod --yes --force
git checkout experimental
```

---

## 6. Build Verification

### Vercel Build Logs
```bash
# Check latest deployment
vercel ls

# Inspect build logs
vercel inspect <deployment-url>
```

### Common Build Failures
| Error | Cause | Fix |
|---|---|---|
| `Module not found` | Missing dependency | `npm install` |
| `Out of memory` | Large bundle | Code split, lazy load |
| `Build timeout` | Slow build | Optimize, remove unused |
| `Type error` | Typecheck failure | Fix TypeScript errors |
| `Lint error` | ESLint violation | `npm run lint:fix` |

---

## 7. Monitoring Post-Deploy

### Health Check Monitoring
```bash
# Vercel function logs
vercel logs --follow

# Check for errors
curl -s https://openlysts.vercel.app/api/health | jq '.status'
```

### Key Metrics to Watch
- API response times (should be < 2s)
- Error rate (should be < 1%)
- Database connection count
- Vercel function execution time

---

## 8. Safety Rules

1. **Never deploy from experimental** — always sync through main
2. **Never force-push to main** — use revert instead
3. **Always verify after deploy** — check health + critical routes
4. **Keep backup branch clean** — only merge from main
5. **Tag releases** — `git tag v1.X.X` for major changes

# Deployment Checklist Rule

Every deployment to production MUST complete this checklist. No exceptions.

---

## Pre-Deployment

### Build Verification
- [ ] `npm run build` — 0 errors
- [ ] `npm run lint` — 0 errors
- [ ] `npm run typecheck` — 0 errors (if applicable)
- [ ] Bundle size within budget (≤ 300KB JS gzipped)

### Code Review
- [ ] All changes reviewed
- [ ] No hardcoded secrets
- [ ] No console.log in production code
- [ ] No unused imports
- [ ] Error handling in place

### Testing
- [ ] Manual smoke test on affected pages
- [ ] API endpoints return expected responses
- [ ] Auth flows work (login, register, logout)
- [ ] No console errors in browser

### Database
- [ ] Migrations are idempotent (IF NOT EXISTS)
- [ ] No destructive schema changes
- [ ] New indexes created if needed
- [ ] No N+1 query patterns introduced

---

## Deployment

### Sync Branches
```bash
git checkout dev && git merge experimental && git push
git checkout main && git merge dev && git push
git checkout backup && git merge main && git push
```

### Deploy
```bash
git checkout main
npx vercel --prod --yes --force
```

### Verify Deployment
- [ ] Health check: `curl https://openlysts.vercel.app/api/health`
- [ ] Homepage loads: `curl https://openlysts.vercel.app/`
- [ ] Discover page loads without crash
- [ ] API endpoints respond correctly
- [ ] No errors in Vercel function logs

---

## Post-Deployment

### Functional Verification
- [ ] Welcome page loads with 3D animation
- [ ] Discover page loads without "Invalid hook call" error
- [ ] Search returns results
- [ ] Filters work correctly
- [ ] Login/logout flow works
- [ ] Registration flow works
- [ ] Profile page loads
- [ ] Settings page loads
- [ ] Admin dashboard loads (if admin)

### Performance Verification
- [ ] Page load time < 3s
- [ ] No layout shifts (CLS < 0.1)
- [ ] Images load with lazy loading
- [ ] No memory leaks (navigate 10 times)

### Security Verification
- [ ] Protected endpoints return 401 without auth
- [ ] Admin endpoints return 403 for non-admins
- [ ] No sensitive data in console logs
- [ ] Rate limiting active on auth endpoints

---

## Rollback Criteria

Trigger rollback if ANY of:
- [ ] Health check fails
- [ ] Homepage doesn't load
- [ ] Discover page crashes
- [ ] Login flow broken
- [ ] API returns 500 on basic operations
- [ ] Database connection fails

### Rollback Procedure
```bash
git checkout main
git revert HEAD
git push origin main
npx vercel --prod --yes --force
git checkout experimental
```

---

## Return to Working Branch

```bash
git checkout experimental
```

---

## Post-Deploy Monitoring

- [ ] Check Vercel function logs for errors (first 5 minutes)
- [ ] Monitor API response times
- [ ] Check database connection count
- [ ] Verify no spike in error rates

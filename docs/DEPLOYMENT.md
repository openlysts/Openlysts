# Openlysts Deployment Guide

## Overview

Openlysts deploys to **Vercel** (frontend + serverless functions) with **Neon PostgreSQL** (managed database).

## Prerequisites

- Vercel account (https://vercel.com)
- Neon account (https://neon.tech)
- GitHub repository access
- Node.js 20+ (for local testing)

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `SESSION_SECRET` | Session encryption key (random 64+ chars) | `a1b2c3d4...` |
| `SESSION_PASSWORD` | Session cookie password (random 32+ chars) | `x1y2z3...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | — |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | — |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | — |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | — |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret | — |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key | — |
| `SMTP_HOST` | Email SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | Email SMTP port | `587` |
| `SMTP_USER` | SMTP username | — |
| `SMTP_PASS` | SMTP password | — |

### Setting Variables

```bash
# Via Vercel CLI
vercel env add DATABASE_URL production
vercel env add SESSION_SECRET production

# Via Vercel Dashboard
# Settings → Environment Variables → Add
```

## Deployment Methods

### 1. Automatic Deployment (Recommended)

Push to `main` branch triggers automatic deployment:

```bash
git checkout main
git merge dev
git push origin main
```

Vercel automatically:
1. Builds frontend
2. Deploys serverless functions
3. Runs health checks
4. Updates DNS

### 2. Manual Deployment

```bash
# Deploy to staging
vercel

# Deploy to production
vercel --prod
```

### 3. Using Deployment Script

```bash
# Staging
bash scripts/deploy.sh staging

# Production
bash scripts/deploy.sh production
```

## Branch Strategy

```
experimental → dev → main → backup
     ↓           ↓        ↓
   staging    staging   production
```

| Branch | Environment | Purpose |
|--------|-------------|---------|
| `experimental` | Staging | Feature development |
| `dev` | Staging | Integration testing |
| `main` | Production | Live deployment |
| `backup` | Backup | Rollback safety |

## Pre-Deployment Checklist

- [ ] All tests pass (`npm run test`)
- [ ] Lint passes (`npm run lint`)
- [ ] Typecheck passes (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console.log statements
- [ ] No secrets in code
- [ ] Environment variables set in Vercel
- [ ] Database migrations applied
- [ ] Audit passes (`npm run audit:quick`)

## Post-Deployment Verification

```bash
# Check health endpoint
curl https://openlysts.vercel.app/api/health

# Check frontend
curl -s https://openlysts.vercel.app | head -20

# Run post-change audit
npm run audit:post-change
```

## Rollback Procedure

### Immediate Rollback (Vercel Dashboard)

1. Go to Vercel Dashboard → Openlysts → Deployments
2. Find the last known good deployment
3. Click "..." → "Promote to Production"

### Git Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force origin main  # ⚠️ Use with caution
```

### Database Rollback

```bash
# Restore from backup
gunzip backups/openlysts_YYYYMMDD_HHMMSS.sql.gz
psql $DATABASE_URL < backups/openlysts_YYYYMMDD_HHMMSS.sql
```

## Database Management

### Migrations

```bash
# Apply migrations
node server/db/migrate.js

# Check schema
node scripts/db/checkSchema.js

# Reset database
bash scripts/db-reset.sh --confirm
```

### Backups

```bash
# Manual backup
bash scripts/backup.sh

# View backups
ls -la backups/
```

### Seeding

```bash
# Seed with test data
bash scripts/seed.sh

# Or use npm script
npm run db:seed
```

## Monitoring

### Health Checks

- **API Health**: `GET /api/health`
- **Database**: Check connection pool stats
- **Rate Limits**: Monitor X-RateLimit-* headers

### Logs

```bash
# Vercel logs
vercel logs

# Real-time logs
vercel logs --follow
```

### Performance

- **Core Web Vitals**: Use Chrome DevTools
- **Bundle Size**: Check `dist/` after build
- **API Response Times**: Monitor in Vercel Analytics

## Troubleshooting

### Common Issues

1. **Build fails**
   - Check environment variables
   - Run `npm run build` locally
   - Check Vercel build logs

2. **Database connection fails**
   - Verify `DATABASE_URL` format
   - Check Neon database status
   - Verify SSL mode (`sslmode=require`)

3. **Authentication fails**
   - Verify `SESSION_SECRET` is set
   - Check cookie settings
   - Clear browser cookies

4. **Rate limiting too aggressive**
   - Check rate limit configuration
   - Verify client IP detection
   - Adjust limits in `server/auth/constants.js`

### Debug Mode

```bash
# Local debugging
DEBUG=openlysts:* npm run dev

# Verbose logging
NODE_LOG_LEVEL=debug npm run dev
```

## Security Hardening

1. **Always use HTTPS** (Vercel default)
2. **Set secure cookies** (HttpOnly, Secure, SameSite)
3. **Enable CSP headers** (Helmet.js)
4. **Rate limit all endpoints**
5. **Validate all input** (Zod schemas)
6. **Use parameterized queries** (never string concat)
7. **Rotate secrets regularly**
8. **Monitor audit logs**

## Cost Optimization

1. **Neon**: Use auto-suspend for dev databases
2. **Vercel**: Monitor serverless function duration
3. **Caching**: Enable Redis/in-memory cache
4. **CDN**: Use Vercel Edge Network
5. **Images**: Optimize with Sharp

## Support

- **Documentation**: See `README.md` and `ARCHITECTURE.md`
- **Issues**: GitHub Issues
- **Security**: See `SECURITY.md`

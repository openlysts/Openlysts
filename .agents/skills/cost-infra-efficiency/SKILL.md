---
name: cost-infra-efficiency
description: "Cost and infrastructure efficiency skill for Openlysts. Covers Vercel serverless budgets, Neon PostgreSQL cost analysis, API quota monitoring, bundle size budgets, and waste reduction."
---

# Cost & Infrastructure Efficiency Skill

## Role & Identity
Infrastructure Cost Engineer ensuring Openlysts runs efficiently without waste. Every unnecessary query, every oversized bundle, every wasted serverless millisecond costs money.

---

## 1. Cost Center Map

| Service | Cost Model | Budget Target |
|---|---|---|
| Vercel (Hobby) | 100GB bandwidth, 100k serverless invocations | Stay within free tier |
| Neon PostgreSQL | Compute hours + storage | Minimize query time |
| GitHub API | 5000 req/hr (unauthenticated: 60) | Use tokens, cache responses |
| YouTube (yt-search) | Free but rate-limited | Cache aggressively |
| Cloudflare Turnstile | Free tier: 1M requests | Unlimited for auth flows |

---

## 2. Vercel Serverless Optimization

### Function Duration Budget
```javascript
// vercel.json
{
  "functions": {
    "api/index.js": {
      "maxDuration": 10  // Hobby: max 10s
    }
  }
}
```

### Cold Start Mitigation
```javascript
// Keep functions warm with cron
// vercel.json
{
  "crons": [{
    "path": "/api/health",
    "schedule": "*/5 * * * *"
  }]
}
```

### Reduce Function Size
```bash
# Check function bundle size
ls -la .vercel/output/functions/

# Target: < 5MB per function
du -sh .vercel/output/functions/ | sort -rh
```

---

## 3. Neon PostgreSQL Optimization

### Query Cost Reduction
```javascript
// BAD: Full table scan
const { rows } = await db.query('SELECT * FROM "Repository"');

// GOOD: Indexed query with LIMIT
const { rows } = await db.query(
  'SELECT id, name, stars FROM "Repository" WHERE stars > 100 ORDER BY stars DESC LIMIT 20'
);
```

### Connection Pool Efficiency
```javascript
// Serverless: minimize connections
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,                     // Keep small
  idleTimeoutMillis: 30000,   // Release idle connections
  connectionTimeoutMillis: 5000,
});
```

### Reduce Storage
```sql
-- Check table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Archive old ingestion runs
DELETE FROM "IngestionRun" WHERE started_at < NOW() - INTERVAL '90 days';

-- Clean old audit logs (keep 1 year)
DELETE FROM "AuditLog" WHERE created_date < NOW() - INTERVAL '1 year';
```

### In-Memory Catalog (Openlysts Pattern)
```javascript
// Load 47k+ repos into RAM on boot
// Query RAM instead of PostgreSQL for search
// Saves: ~100k DB queries/day
const catalog = await loadFullCatalog(); // One-time DB read
// All search operations hit RAM (sub-20ms)
```

---

## 4. GitHub API Quota Management

### Rate Limit Awareness
```javascript
// Check remaining quota
const rl = await githubFetch('https://api.github.com/rate_limit', token);
console.log(`GitHub API: ${rl.resources.core.remaining}/${rl.resources.core.limit}`);
```

### Cache GitHub Responses
```javascript
// Ingestion: cache repo data locally
const cache = new Map();

async function fetchRepoCached(owner, name, token) {
  const key = `${owner}/${name}`;
  if (cache.has(key)) return cache.get(key);

  const data = await githubFetch(`https://api.github.com/repos/${owner}/${name}`, token);
  cache.set(key, data);
  return data;
}
```

### Batch Ingestion
```javascript
// Process repos in batches to avoid rate limits
async function ingestBatch(repos, batchSize = 5) {
  for (let i = 0; i < repos.length; i += batchSize) {
    const batch = repos.slice(i, i + batchSize);
    await Promise.all(batch.map(ingest));
    await sleep(1000); // Rate limit pause between batches
  }
}
```

---

## 5. Bundle Size Budget

### Target Sizes
| Asset | Budget | Current |
|---|---|---|
| Total JS (gzipped) | ≤ 300KB | Measure |
| Total CSS (gzipped) | ≤ 50KB | Measure |
| Total Images (per page) | ≤ 500KB | Measure |
| Initial load JS | ≤ 150KB | Measure |

### Monitoring
```bash
# Check bundle sizes
npx vite build
ls -la dist/assets/*.js | awk '{print $5, $9}'
du -sh dist/assets/

# Visual analysis
npx vite-bundle-visualizer
```

### Common Waste
| Waste | Savings | Fix |
|---|---|---|
| Unused lodash | ~70KB | Remove dependency |
| Duplicate React | ~150KB | Vite resolve.dedupe |
| Unused Radix components | ~20KB each | Tree shaking |
| Large fonts | ~100KB | Subset, use `font-display: swap` |
| Unminified dev code | Varies | Production build |

---

## 6. Bandwidth Optimization

### HTTP Caching
```javascript
// Static assets: immutable
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

// API responses: short cache
res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

// Auth pages: no cache
res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
```

### Compression
```javascript
// Vercel automatically gzips/brotli
// Verify with curl
curl -sI -H "Accept-Encoding: gzip" https://openlysts.vercel.app/ | grep -i "content-encoding"
```

---

## 7. Monitoring Dashboard

### Key Metrics to Track
```bash
# 1. Vercel bandwidth
curl -s "https://api.vercel.com/v6/buckets" -H "Authorization: Bearer $TOKEN"

# 2. Neon compute time
curl -s "https://console.neon.tech/api/v2/projects" -H "Authorization: Bearer $TOKEN"

# 3. GitHub API usage
curl -s "https://api.github.com/rate_limit" -H "Authorization: token $GITHUB_TOKEN"

# 4. Local bundle size
du -sh dist/
```

### Cost Alert Thresholds
| Metric | Warning | Critical |
|---|---|---|
| Vercel bandwidth | > 80GB | > 95GB |
| Neon compute hours | > 80h | > 95h |
| GitHub API remaining | < 1000 | < 100 |
| Bundle size | > 350KB | > 500KB |

---

## 8. Waste Reduction Checklist

### Code
- [ ] No unused dependencies in package.json
- [ ] No dead code in source files
- [ ] No console.log in production
- [ ] No large test data in bundle

### Database
- [ ] All queries use indexes
- [ ] No N+1 query patterns
- [ ] Connection pool sized appropriately
- [ ] Old data archived/purged

### Network
- [ ] API responses have cache headers
- [ ] Images use lazy loading
- [ ] Fonts use `font-display: swap`
- [ ] No unnecessary third-party scripts

### Serverless
- [ ] Functions stay within time limits
- [ ] No unnecessary warm-up invocations
- [ ] Function bundles optimized
- [ ] No large dependencies in functions

---

## 9. Cost Projection

### Monthly Estimates (Free Tier)
| Service | Free Tier | Estimated Usage | Status |
|---|---|---|---|
| Vercel Bandwidth | 100GB | ~20GB | ✅ |
| Vercel Builds | 6000/min | ~500 | ✅ |
| Neon Compute | 191.9h | ~50h | ✅ |
| Neon Storage | 0.5GB | ~0.2GB | ✅ |
| GitHub API | 5000/hr | ~500/hr | ✅ |

### Scaling Triggers
- 1000+ daily active users → Consider Vercel Pro
- 100k+ repos in catalog → Consider Redis cache
- 10k+ API calls/day → Consider API gateway
- Multiple admins → Consider role-based rate limits

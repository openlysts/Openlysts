# Performance Budget Rule

Every feature in Openlysts MUST meet these performance budgets. No exceptions.

---

## 1. Bundle Size Budget

| Asset | Budget (gzipped) | Action if exceeded |
|---|---|---|
| Total JS | ≤ 300KB | Code split, remove unused deps |
| Total CSS | ≤ 50KB | Purge unused Tailwind classes |
| Initial load JS | ≤ 150KB | Lazy load non-critical routes |
| Total images/page | ≤ 500KB | Compress, lazy load, use WebP |
| Single JS chunk | ≤ 100KB | Split into smaller chunks |

### Check
```bash
du -sh dist/assets/*.js | sort -rh
npx vite-bundle-visualizer
```

---

## 2. Core Web Vitals Budget

| Metric | Target | Maximum |
|---|---|---|
| LCP (Largest Contentful Paint) | ≤ 2.5s | 4.0s |
| INP (Interaction to Next Paint) | ≤ 200ms | 500ms |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | 0.25 |
| FCP (First Contentful Paint) | ≤ 1.8s | 3.0s |
| TTFB (Time to First Byte) | ≤ 800ms | 1800ms |

### Check
```javascript
const perf = performance.getEntriesByType('navigation')[0];
console.log('FCP:', performance.getEntriesByName('first-contentful-paint')[0]?.startTime);
console.log('LCP:', perf.domContentLoadedEventEnd - perf.startTime);
```

---

## 3. DOM Budget

| Metric | Budget | Action |
|---|---|---|
| DOM nodes per page | ≤ 2000 | Virtual scroll, lazy load |
| Images per page | ≤ 20 | Lazy load offscreen |
| Scripts per page | ≤ 5 | Bundle, code split |
| Stylesheets per page | ≤ 3 | Combine, purge |

### Check
```javascript
document.querySelectorAll('*').length  // DOM nodes
document.querySelectorAll('img').length  // Images
document.querySelectorAll('script[src]').length  // Scripts
```

---

## 4. Memory Budget

| Metric | Budget | Action |
|---|---|---|
| JS heap size | ≤ 50MB | Fix memory leaks |
| Three.js draw calls | ≤ 5 | Merge geometries |
| Event listeners | Clean on unmount | useEffect cleanup |

### Check
```javascript
performance.memory?.usedJSHeapSize / 1024 / 1024  // MB
```

---

## 5. Network Budget

| Metric | Budget | Action |
|---|---|---|
| API calls per page load | ≤ 5 | Batch, prefetch |
| Total transfer per page | ≤ 1MB | Compress, cache |
| Third-party requests | ≤ 3 | Remove unused |

---

## 6. Serverless Budget

| Metric | Budget | Action |
|---|---|---|
| Function execution time | ≤ 10s (Hobby) | Optimize queries |
| Function bundle size | ≤ 5MB | Remove heavy deps |
| Cold start time | ≤ 2s | Keep warm with cron |

---

## 7. Enforcement

- Check bundle size before every deploy
- Monitor Core Web Vitals in production
- Review memory usage during code review
- Alert if any budget is exceeded

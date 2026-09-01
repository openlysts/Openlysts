---
name: performance-core-web-vitals
description: "Performance monitoring and Core Web Vitals skill for Openlysts. Covers LCP, INP, CLS optimization, bundle analysis, memory profiling, network optimization, and serverless performance."
---

# Performance & Core Web Vitals Skill

## Role & Identity
Performance Engineer obsessed with sub-second loads and buttery 60fps interactions. Every millisecond counts.

## Target Metrics (Google "Good" Thresholds)
| Metric | Good | Needs Improvement | Poor |
|---|---|---|---|
| LCP (Largest Contentful Paint) | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| INP (Interaction to Next Paint) | ≤ 200ms | ≤ 500ms | > 500ms |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | ≤ 0.25 | > 0.25 |
| FCP (First Contentful Paint) | ≤ 1.8s | ≤ 3.0s | > 3.0s |
| TTFB (Time to First Byte) | ≤ 800ms | ≤ 1800ms | > 1800ms |

---

## 1. Measurement Protocol

### Core Web Vitals Collection
```javascript
// Add to index.html or main entry
function reportWebVitals(metric) {
  console.log(`[Perf] ${metric.name}: ${Math.round(metric.value)}ms`, metric);
  // Send to analytics in production
}

// Use web-vitals library
import { onLCP, onINP, onCLS } from 'web-vitals';
onLCP(reportWebVitals);
onINP(reportWebVitals);
onCLS(reportWebVitals);
```

### Navigation Timing
```javascript
const perf = performance.getEntriesByType('navigation')[0];
const metrics = {
  dns: Math.round(perf.domainLookupEnd - perf.domainLookupStart),
  connect: Math.round(perf.connectEnd - perf.connectStart),
  ttfb: Math.round(perf.responseStart - perf.startTime),
  domContentLoaded: Math.round(perf.domContentLoadedEventEnd - perf.startTime),
  loadComplete: Math.round(perf.loadEventEnd - perf.startTime),
};
```

---

## 2. Bundle Optimization

### Bundle Analysis
```bash
# Vite bundle analysis
npx vite-bundle-visualizer

# Check bundle size
ls -la dist/assets/*.js | awk '{print $5, $9}'

# Count total JS size
du -sh dist/assets/
```

### Code Splitting
```javascript
// Lazy load routes
const DiscoverPage = React.lazy(() => import('./pages/DiscoverPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));

// Lazy load heavy components
const ThreeBackground = React.lazy(() => import('./components/openlyst/ThreeBackground'));
const MarkdownViewer = React.lazy(() => import('./components/MarkdownViewer'));
```

### Tree Shaking Verification
```bash
# Check if unused exports are eliminated
npx vite build --mode production 2>&1 | grep "rendered"

# Verify lodash is not bundled (if removed)
grep -r "lodash" dist/assets/*.js  # Should be empty
```

---

## 3. Image & Asset Optimization

### Lazy Loading
```html
<img loading="lazy" decoding="async" src="..." alt="..." />
```

### Preload Critical Resources
```html
<link rel="preload" href="/fonts/mona-sans.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preconnect" href="https://fonts.googleapis.com" />
```

### Font Loading Strategy
```css
@font-face {
  font-family: 'Mona Sans';
  font-display: swap; /* Show fallback immediately */
  src: url('/fonts/mona-sans.woff2') format('woff2');
}
```

---

## 4. React Performance Patterns

### Memoization
```javascript
// Memoize expensive computations
const sortedRepos = useMemo(() => {
  return repos.sort((a, b) => b.stars - a.stars);
}, [repos]);

// Memoize callbacks passed to children
const handleBookmark = useCallback((repoId) => {
  toggleBookmark(repoId);
}, []);
```

### Avoid Unnecessary Re-renders
```javascript
// Use React.memo for pure components
const RepoCard = React.memo(function RepoCard({ repo, onBookmark }) {
  return <div>{/* ... */}</div>;
});

// Use state selectors with Zustand/Redux
const stars = useStore(state => state.repos[id].stars); // Only re-render when stars change
```

### Virtual Scrolling for Large Lists
```javascript
// For 100+ items, use react-window or react-virtuoso
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={repos.length}
  itemSize={120}
  width="100%"
>
  {({ index, style }) => <RepoCard repo={repos[index]} style={style} />}
</FixedSizeList>
```

---

## 5. Three.js / WebGL Performance

### Memory Leak Prevention
```javascript
// Always dispose Three.js resources
function cleanup() {
  renderer.dispose();
  geometry.dispose();
  material.dispose();
  texture.dispose();
  cancelAnimationFrame(animationId);
}

// Use useEffect cleanup
useEffect(() => {
  const scene = new THREE.Scene();
  // ... setup
  return () => {
    scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    renderer.dispose();
  };
}, []);
```

### Draw Call Budget
```javascript
// Target: ≤ 3 draw calls for backgrounds
// Use BufferGeometry (not Geometry)
const geometry = new THREE.BufferGeometry();
// Merge meshes where possible
const mergedMesh = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);
```

### Frame Rate Monitoring
```javascript
let frameCount = 0;
let lastTime = performance.now();

function measureFPS() {
  frameCount++;
  const now = performance.now();
  if (now - lastTime >= 1000) {
    console.log(`[Perf] FPS: ${frameCount}`);
    frameCount = 0;
    lastTime = now;
  }
  requestAnimationFrame(measureFPS);
}
```

---

## 6. Network Optimization

### Request Waterfall Reduction
```javascript
// Parallel requests instead of sequential
const [repos, alternatives, trending] = await Promise.all([
  fetchRepos(),
  fetchAlternatives(),
  fetchTrending(),
]);
```

### Cache Strategy
```javascript
// HTTP caching headers
res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

// React Query caching
useQuery('repos', fetchRepos, {
  staleTime: 5 * 60 * 1000,   // 5 min
  cacheTime: 30 * 60 * 1000,  // 30 min
});
```

### Debounce Search
```javascript
const [query, setQuery] = useState('');
const debouncedQuery = useDeferredValue(query); // React 18
// Or use debounce hook
const debouncedSearch = useDebounce(search, 300);
```

---

## 7. Serverless Performance

### Cold Start Mitigation
```javascript
// Keep serverless functions warm with Vercel cron
// vercel.json
{
  "crons": [{ "path": "/api/health", "schedule": "*/5 * * * *" }]
}
```

### Connection Pool Sizing
```javascript
// Neon serverless: max 5 connections
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
});
```

---

## 8. Performance Budget

| Resource | Budget | Current |
|---|---|---|
| Total JS bundle | ≤ 300KB gzipped | Measure |
| Total CSS | ≤ 50KB gzipped | Measure |
| Total images (per page) | ≤ 500KB | Measure |
| DOM nodes (per page) | ≤ 2000 | Measure |
| Third-party scripts | ≤ 3 | Count |
| LCP | ≤ 2.5s | Measure |
| INP | ≤ 200ms | Measure |
| CLS | ≤ 0.1 | Measure |

---

## 9. Profiling Workflow

### Chrome DevTools Profiling
1. Open DevTools → Performance tab
2. Click Record, interact with the page
3. Stop recording, analyze:
   - Long tasks (> 50ms)
   - Layout thrashing (forced reflows)
   - Excessive garbage collection
   - Animation jank

### Memory Profiling
```javascript
// Take heap snapshot
console.memory(); // { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit }

// Monitor growth
setInterval(() => {
  const mem = performance.memory?.usedJSHeapSize;
  if (mem) console.log(`[Mem] ${(mem / 1024 / 1024).toFixed(1)}MB`);
}, 5000);
```

### Lighthouse CI
```bash
npx lighthouse http://localhost:5173 --output=json --output-path=./lighthouse-report.json
```

---

## 10. Verification Checklist

Before any feature ships:
- [ ] No layout shift (CLS ≤ 0.1) — explicit width/height on images
- [ ] Images use `loading="lazy"` and `decoding="async"`
- [ ] Heavy components are code-split with `React.lazy`
- [ ] No memory leaks in Three.js/WebGL (dispose on unmount)
- [ ] Search is debounced (≥ 200ms)
- [ ] API responses have cache headers
- [ ] Bundle size within budget (check with `vite-bundle-visualizer`)
- [ ] No console warnings about performance
- [ ] DOM node count ≤ 2000 per page

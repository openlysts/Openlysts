---
name: error-resilience
description: "Error handling and resilience skill for Openlysts. Covers retry patterns, circuit breakers, error boundaries, graceful degradation, timeout handling, and partial-failure recovery."
---

# Error Handling & Resilience Skill

## Role & Identity
Resilience Engineer ensuring Openlysts degrades gracefully under every failure mode. Every external dependency is a potential failure point — plan for it.

## Core Principles
1. **Fail gracefully** — never show blank white pages or stack traces
2. **Retry with backoff** — transient failures are normal, handle them
3. **Circuit breakers** — stop hammering dead services
4. **Timeout everything** — never wait forever
5. **Partial results > no results** — serve what you can

---

## 1. Frontend Error Boundaries

### React Error Boundary Pattern
```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2>Something went wrong</h2>
          <p className="text-muted-foreground mt-2">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### Per-Route Error Boundaries
```jsx
<ErrorBoundary>
  <Routes>
    <Route path="/discover" element={<DiscoverPage />} />
    <Route path="/profile" element={<ProfilePage />} />
  </Routes>
</ErrorBoundary>
```

---

## 2. Retry with Exponential Backoff

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000), // 10s timeout
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * 2 ** attempt, 10000); // Cap at 10s
        const jitter = delay * (0.5 + Math.random() * 0.5);
        await new Promise(r => setTimeout(r, jitter));
      }
    }
  }
  throw lastError;
}
```

---

## 3. Circuit Breaker Pattern

```javascript
class CircuitBreaker {
  constructor(fn, { threshold = 5, timeout = 30000 } = {}) {
    this.fn = fn;
    this.failures = 0;
    this.state = 'CLOSED'; // CLOSED = normal, OPEN = failing, HALF_OPEN = testing
    this.threshold = threshold;
    this.timeout = timeout;
    this.lastFailure = 0;
  }

  async call(...args) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN — service unavailable');
      }
    }

    try {
      const result = await this.fn(...args);
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
      }
      return result;
    } catch (err) {
      this.failures++;
      this.lastFailure = Date.now();
      if (this.failures >= this.threshold) {
        this.state = 'OPEN';
      }
      throw err;
    }
  }
}

// Usage
const youtubeCircuit = new CircuitBreaker(
  (query) => fetchYouTubeVideos(query),
  { threshold: 3, timeout: 60000 }
);
```

---

## 4. API Error Response Patterns

### Standard Error Envelope
```javascript
// Server
res.status(500).json({
  error: true,
  message: 'Failed to load repositories',  // User-friendly
  // NEVER include: stack trace, SQL query, internal paths
});
```

### Client Error Handling
```javascript
async function apiCall(url, options) {
  try {
    const res = await fetchWithRetry(url, options);
    const data = await res.json();
    if (data.error) throw new Error(data.message);
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    if (err.message.includes('Failed to fetch')) {
      throw new Error('Network error. Check your connection.');
    }
    throw err;
  }
}
```

---

## 5. Timeout Patterns

### Fetch Timeout
```javascript
const response = await fetch(url, {
  signal: AbortSignal.timeout(10000), // 10s
});
```

### Database Query Timeout
```javascript
// PostgreSQL statement_timeout
await db.query('SET statement_timeout = 5000'); // 5s
```

### Vercel Serverless Timeout Awareness
```javascript
// Vercel Hobby: 10s, Pro: 60s
// Long operations must be batched
async function processInBatches(items, batchSize = 5) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(process));
    results.push(...batchResults);
  }
  return results;
}
```

---

## 6. Graceful Degradation Patterns

### Partial Data Loading
```jsx
function DiscoverPage() {
  const { data: repos, error: reposError } = useQuery('repos');
  const { data: trending, error: trendingError } = useQuery('trending');

  return (
    <div>
      {reposError ? (
        <div className="text-yellow-500">Could not load repositories</div>
      ) : (
        <RepoGrid repos={repos} />
      )}
      {!trendingError && <TrendingSection repos={trending} />}
    </div>
  );
}
```

### Offline Fallback
```javascript
// syncOutbox.js pattern
window.addEventListener('offline', () => {
  showOfflineBanner();
});

window.addEventListener('online', () => {
  hideOfflineBanner();
  syncPendingChanges(); // Retry queued mutations
});
```

### Stale-While-Revalidate
```javascript
// React Query
useQuery('repos', fetchRepos, {
  staleTime: 5 * 60 * 1000,    // 5 min fresh
  cacheTime: 30 * 60 * 1000,   // 30 min cached
  refetchOnWindowFocus: true,
});
```

---

## 7. Database Resilience

### Connection Recovery
```javascript
pool.on('error', (err) => {
  console.error('[DB] Idle client error:', err.message);
  // Pool will auto-recover with new connections
});
```

### Query Timeout
```javascript
async function safeQuery(text, params, timeoutMs = 5000) {
  const client = await pool.connect();
  try {
    await client.query(`SET statement_timeout = ${timeoutMs}`);
    return await client.query(text, params);
  } finally {
    client.release();
  }
}
```

---

## 8. Failure Modes Checklist

| Failure Mode | Expected Behavior | Verification |
|---|---|---|
| API returns 500 | Error boundary shows friendly message | Intercept fetch, return 500 |
| API times out | "Request timed out" message | AbortSignal.timeout |
| Database unreachable | Graceful fallback, cached data shown | Kill DB connection |
| Network offline | Offline banner, cached bookmarks work | navigator.onLine = false |
| Invalid JSON response | Error caught, not crash | Mock malformed response |
| XSS in API response | Rendered as escaped text | Inject `<script>` in data |
| Race condition (rapid clicks) | Only one request fires | Debounce/throttle |
| Large response (10MB) | No memory crash | Stream/chunk processing |

---

## 9. Monitoring & Alerting

### Key Metrics to Track
- API response times (p50, p95, p99)
- Error rates per endpoint
- Database connection pool utilization
- Circuit breaker state changes
- Retry attempt counts
- Timeout occurrences

### Log Pattern
```javascript
console.error(`[SERVICE] ${functionName} failed: ${err.message}`, {
  attempt,
  duration: Date.now() - start,
  context: { userId, endpoint },
});
```

---

## 10. Verification Checklist

Before any feature ships:
- [ ] Error boundary wraps the feature's route/component
- [ ] API calls have try/catch with user-friendly messages
- [ ] External API calls have timeouts (AbortSignal.timeout)
- [ ] Database queries have statement_timeout
- [ ] No promise rejections go unhandled
- [ ] Loading states shown during async operations
- [ ] Empty states shown when no data available
- [ ] Offline mode degrades gracefully
- [ ] No blank white pages under any failure condition

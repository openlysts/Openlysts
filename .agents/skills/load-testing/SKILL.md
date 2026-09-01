---
name: load-testing
description: Load testing, performance profiling, and stress testing for APIs and web applications
---

# Load Testing & Performance Profiling

## Role & Identity

You are a performance engineer specializing in load testing, stress testing, and performance profiling for Node.js/Express APIs and React applications. You identify bottlenecks, measure throughput, and validate performance under load.

## 1. Load Testing Strategy

### Test Types

| Type | Purpose | Duration | Users |
|------|---------|----------|-------|
| **Load Test** | Normal expected load | 5-30 min | 10-50 concurrent |
| **Stress Test** | Find breaking point | 10-30 min | Ramp to 100+ |
| **Spike Test** | Sudden traffic surge | 5 min | 0→100→0 |
| **Soak Test** | Endurance over time | 1-4 hours | 10-20 sustained |
| **Smoke Test** | Quick sanity check | 1-2 min | 1-5 |

### Key Metrics

- **Throughput**: Requests per second (RPS)
- **Latency**: P50, P95, P99 response times
- **Error Rate**: Percentage of failed requests
- **Concurrency**: Active simultaneous connections
- **Resource Usage**: CPU, memory, connections

## 2. Tools & Setup

### Node.js Load Testing (autocannon)

```bash
# Install
npm install -g autocannon

# Basic load test
autocannon -c 10 -d 30 http://localhost:3001/api/entities

# With headers
autocannon -c 10 -d 30 -H "Cookie=connect.sid=xxx" http://localhost:3001/api/profile
```

### k6 (Grafana)

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up
    { duration: '1m', target: 10 },   // Sustain
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('http://localhost:3001/api/entities?page=1&limit=5');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });
  sleep(1);
}
```

### Custom Load Script

```bash
# Use the project's load testing script
npm run load:api
# Or directly:
node scripts/load/api-load-test.js
```

## 3. Performance Profiling

### Node.js Profiling

```bash
# CPU profile
node --prof server/index.js
node --prof-process isolate-*.log > processed.txt

# Heap snapshot
node --inspect server/index.js
# Open chrome://inspect in Chrome
```

### Memory Leak Detection

```bash
# Monitor heap usage over time
node -e "
setInterval(() => {
  const mem = process.memoryUsage();
  console.log(JSON.stringify({
    timestamp: Date.now(),
    heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(1),
    rss: (mem.rss / 1024 / 1024).toFixed(1)
  }));
}, 5000);
" >> reports/memory-log.jsonl
```

### Database Query Profiling

```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 100; -- queries > 100ms
SELECT pg_reload_conf();

-- Analyze slow queries
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## 4. Performance Budgets

| Metric | Budget | Threshold |
|--------|--------|-----------|
| P50 Latency | < 200ms | 500ms |
| P95 Latency | < 1000ms | 2000ms |
| P99 Latency | < 2000ms | 5000ms |
| Error Rate | < 0.1% | 1% |
| Throughput | > 50 RPS | 20 RPS |
| Lighthouse Perf | > 70 | 50 |
| LCP | < 2.5s | 4s |
| CLS | < 0.1 | 0.25 |
| FID | < 100ms | 300ms |
| Bundle Size | < 500KB | 1MB |

## 5. Common Bottlenecks

### Backend
- **Unindexed queries**: Add indexes for WHERE/JOIN columns
- **N+1 queries**: Use JOIN or batch queries
- **Connection pool exhaustion**: Increase pool size or optimize queries
- **Synchronous blocking**: Use async/await properly
- **Large payloads**: Paginate, limit fields

### Frontend
- **Large bundles**: Code-split, lazy load, tree-shake
- **Unoptimized images**: Compress, use WebP, lazy load
- **Excessive re-renders**: Memoize, optimize state
- **Third-party scripts**: Async load, defer non-critical
- **Layout thrashing**: Batch DOM reads/writes

## 6. Verification Checklist

- [ ] Load test script exists and runs
- [ ] Performance budgets defined
- [ ] P95 latency within threshold
- [ ] Error rate under load < 1%
- [ ] Memory stable over 30+ minutes
- [ ] Database queries < 100ms average
- [ ] Bundle size within budget
- [ ] Lighthouse score > 70
- [ ] No memory leaks detected
- [ ] Connection pool handles load

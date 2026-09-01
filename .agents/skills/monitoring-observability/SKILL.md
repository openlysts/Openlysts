---
name: monitoring-observability
description: Application monitoring, observability, logging, metrics collection, alerting, and incident response
---

# Monitoring & Observability

## Role & Identity

You are an SRE/DevOps engineer specializing in application monitoring, structured logging, metrics collection, alerting, and incident response for Node.js/Express applications on Vercel/Neon.

## 1. Monitoring Stack

### Components

| Layer | Tool | Purpose |
|-------|------|---------|
| **Logging** | Structured JSON logs | Event tracking |
| **Metrics** | Custom + Vercel Analytics | Performance measurement |
| **Tracing** | Request IDs | Request flow tracking |
| **Alerting** | Error rate + latency | Anomaly detection |
| **Uptime** | Health checks | Availability monitoring |

### Log Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| `debug` | Development troubleshooting | Query parameters, variables |
| `info` | Normal operations | Request completed, user logged in |
| `warn` | Unexpected but recoverable | Slow query, rate limited |
| `error` | Failures requiring attention | DB connection failed, unhandled exception |
| `fatal` | System cannot continue | Out of memory, corruption |

## 2. Structured Logging

### Format

```json
{
  "timestamp": "2026-09-01T00:00:00.000Z",
  "level": "INFO",
  "message": "Request completed",
  "module": "api",
  "requestId": "req_123456_abc",
  "method": "GET",
  "path": "/api/entities",
  "statusCode": 200,
  "duration": 45,
  "userId": "usr_xxx"
}
```

### Implementation

```javascript
// server/middleware/logger.js
const { logger } = require('../middleware/logger');
logger.info('User registered', { userId, email: maskEmail(email) });
logger.error('Query failed', { query: truncate(query), error: err.message, duration });
```

### Rules

- **Never log secrets**: passwords, tokens, API keys
- **Mask PII**: emails, IPs in logs
- **Include context**: requestId, userId, duration
- **Structured format**: Always JSON, never freeform strings
- **Appropriate level**: Don't log errors at info level

## 3. Health Checks

### Endpoint

```
GET /api/health
{
  "ok": true,
  "status": 200,
  "service": "openlysts-api",
  "version": "1.0.0",
  "timestamp": "2026-09-01T00:00:00.000Z"
}
```

### Checks

| Check | Method | Threshold |
|-------|--------|-----------|
| API responds | HTTP 200 | < 1s |
| Database connected | pg query | < 2s |
| Memory usage | process.memoryUsage | < 500MB |
| Disk space | fs.stat | > 100MB free |

### Scripts

```bash
# Run health checks
node scripts/monitoring/health-check.js

# Check error rates
node scripts/monitoring/error-rate.js

# Detect anomalies
node scripts/monitoring/anomaly-detect.js
```

## 4. Metrics Collection

### Application Metrics

- **Request count**: Total requests per endpoint
- **Response time**: P50, P95, P99 latency
- **Error rate**: 4xx and 5xx responses per minute
- **Active users**: Concurrent sessions
- **Cache hit rate**: Cache hits / total requests

### Infrastructure Metrics

- **Serverless duration**: Vercel function execution time
- **Database connections**: Active pool connections
- **Neon compute time**: Database CPU usage
- **Memory**: Heap usage, RSS, external

### Collection Points

```javascript
// After request completes
metrics.requestDuration.observe(duration);
metrics.requestCount.inc({ method, path, status });

// On error
metrics.errorCount.inc({ module, error_type });

// Periodic
metrics.memoryUsage.set(process.memoryUsage().heapUsed);
```

## 5. Alerting Rules

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| High Error Rate | > 5% for 5 min | Critical | Page on-call |
| Slow Responses | P95 > 5s for 10 min | High | Notify team |
| Memory Spike | > 80% for 5 min | High | Investigate |
| DB Connection Pool | > 80% utilized | Medium | Check queries |
| Rate Limit Spike | > 50% hitting limits | Medium | Review traffic |

## 6. Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P0 | Service completely down | Immediate |
| P1 | Major feature broken | 30 minutes |
| P2 | Degraded performance | 2 hours |
| P3 | Minor issue | Next business day |

### Response Steps

1. **Detect**: Alert fires or user reports
2. **Triage**: Assess severity and impact
3. **Mitigate**: Rollback, disable feature, scale up
4. **Investigate**: Check logs, metrics, traces
5. **Fix**: Apply hotfix or full fix
6. **Verify**: Confirm resolution
7. **Post-mortem**: Document and improve

### Rollback Procedure

```bash
# Quick rollback
bash scripts/rollback/rollback.sh production --dry-run  # Preview
bash scripts/rollback/rollback.sh production             # Execute

# Database rollback (if needed)
bash scripts/rollback/db-rollback.sh --confirm
```

## 7. Log Analysis

### Useful Queries

```bash
# Error count in last hour
cat reports/*.jsonl | jq 'select(.level == "ERROR" and .timestamp > (now - 3600))' | wc -l

# Slow requests
cat reports/*.jsonl | jq 'select(.duration > 2000)'

# Requests by user
cat reports/*.jsonl | jq 'group_by(.userId) | map({user: .[0].userId, count: length})'

# Error rate by endpoint
cat reports/*.jsonl | jq 'select(.level == "ERROR") | group_by(.path) | map({path: .[0].path, count: length})'
```

## 8. Verification Checklist

- [ ] Structured logging middleware installed
- [ ] Health check endpoint returns all components
- [ ] Request ID tracking works end-to-end
- [ ] Error rate monitoring active
- [ ] Anomaly detection script runs
- [ ] Rollback script tested
- [ ] Alert thresholds defined
- [ ] Incident response documented
- [ ] Log analysis tools available
- [ ] Memory monitoring active

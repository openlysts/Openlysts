---
name: feature-flags
description: Feature flag management, progressive rollouts, A/B testing, and kill switches for safe deployments
---

# Feature Flags

## Role & Identity

You are a release engineer specializing in feature flag management, progressive rollouts, A/B testing, and kill switches. You enable safe, controlled feature delivery without code deployments.

## 1. Feature Flag Types

| Type | Purpose | Lifecycle |
|------|---------|-----------|
| **Release** | Toggle new features | Short-lived (days-weeks) |
| **Experiment** | A/B test variations | Medium (weeks-months) |
| **Ops** | Kill switches, maintenance | Long-lived |
| **Permission** | Beta access, entitlements | Long-lived |

## 2. Implementation Patterns

### Simple Toggle (File-Based)

```javascript
// config/feature-flags.js
const flags = {
  darkMode: process.env.FF_DARK_MODE === 'true',
  newSearch: process.env.FF_NEW_SEARCH === 'true',
  betaFeatures: process.env.FF_BETA === 'true',
};

function isEnabled(flagName) {
  return flags[flagName] === true;
}

module.exports = { isEnabled, flags };
```

### Database-Backed Flags

```sql
CREATE TABLE feature_flags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### React Hook

```javascript
// src/hooks/useFeatureFlag.js
function useFeatureFlag(flagName) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    fetch(`/api/feature-flags/${flagName}`)
      .then(res => res.json())
      .then(data => setEnabled(data.enabled))
      .catch(() => setEnabled(false));
  }, [flagName]);

  return enabled;
}

// Usage
function SearchPage() {
  const isNewSearch = useFeatureFlag('newSearch');
  return isNewSearch ? <NewSearch /> : <OldSearch />;
}
```

## 3. Progressive Rollout Strategy

### Rollout Stages

| Stage | Audience | Duration |
|-------|----------|----------|
| **1. Canary** | 1% of users | 1-2 days |
| **2. Early Adopters** | 10% of users | 2-3 days |
| **3. Gradual** | 25% → 50% → 75% | 1 week |
| **4. General** | 100% of users | Permanent |
| **5. Cleanup** | Remove flag, hardcode | After 2 weeks |

### Rollout Script

```bash
# Enable for 10% of users
curl -X PUT /api/admin/feature-flags/newSearch \
  -H "Content-Type: application/json" \
  -d '{"enabled": true, "rolloutPercentage": 10}'

# Monitor error rate
npm run monitor:errors

# Increase if stable
curl -X PUT /api/admin/feature-flags/newSearch \
  -d '{"rolloutPercentage": 50}'
```

## 4. Kill Switch Pattern

### Purpose

Immediately disable a feature without deployment when issues are detected.

### Implementation

```javascript
// Middleware that checks kill switch
function killSwitchMiddleware(flagName) {
  return (req, res, next) => {
    if (!isEnabled(flagName)) {
      return res.status(503).json({
        ok: false,
        error: 'Feature temporarily unavailable',
        retryAfter: 300,
      });
    }
    next();
  };
}

// Apply to routes
app.use('/api/new-feature', killSwitchMiddleware('newFeature'));
```

### Emergency Script

```bash
# Disable feature immediately
curl -X POST /api/admin/feature-flags/emergency-disable \
  -d '{"flags": ["newSearch", "betaFeatures"]}'
```

## 5. A/B Testing

### Setup

```javascript
// Assign user to variant
function getVariant(userId, experiment) {
  const hash = hashCode(userId + experiment);
  const bucket = Math.abs(hash) % 100;

  if (bucket < 50) return 'control';
  if (bucket < 75) return 'variant-a';
  return 'variant-b';
}

// Track metrics
function trackExperiment(userId, experiment, variant, event) {
  db.query(
    'INSERT INTO experiment_events (user_id, experiment, variant, event) VALUES ($1, $2, $3, $4)',
    [userId, experiment, variant, event]
  );
}
```

### Analysis

```sql
-- Conversion rates by variant
SELECT variant, COUNT(*) as users,
  COUNT(*) FILTER (WHERE event = 'converted') as conversions,
  ROUND(COUNT(*) FILTER (WHERE event = 'converted')::numeric / COUNT(*) * 100, 2) as rate
FROM experiment_events
WHERE experiment = 'newSearch'
GROUP BY variant;
```

## 6. Flag Lifecycle Management

### Cleanup Checklist

- [ ] Flag enabled for 100% of users for 2+ weeks
- [ ] No error rate difference between variants
- [ ] Performance metrics stable
- [ ] Remove flag from code
- [ ] Remove flag from database
- [ ] Update documentation

### Stale Flag Detection

```sql
-- Find flags enabled for > 30 days (should be cleaned up)
SELECT name, enabled_at, NOW() - enabled_at as age
FROM feature_flags
WHERE enabled = true
AND enabled_at < NOW() - INTERVAL '30 days';
```

## 7. Verification Checklist

- [ ] Feature flag system implemented
- [ ] Flags stored in database or env vars
- [ ] React hook available for frontend
- [ ] Kill switch middleware works
- [ ] Rollout percentages configurable
- [ ] A/B test tracking works
- [ ] Flag cleanup process defined
- [ ] Stale flag detection active
- [ ] Emergency disable endpoint secured
- [ ] Documentation maintained

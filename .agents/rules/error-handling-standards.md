# Error Handling Standards Rule

Every error in Openlysts MUST be handled gracefully. Users must never see blank pages, stack traces, or unhandled rejections.

---

## 1. Backend Error Handling

### Every Endpoint
```javascript
router.get('/endpoint', async (req, res) => {
  try {
    const result = await doWork();
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[SERVICE] Error:', err.message);
    res.status(500).json({ error: true, message: 'User-friendly message.' });
  }
});
```

### Error Response Rules
- ALWAYS use `{ error: true, message: "..." }` format
- ALWAYS log with service prefix: `[SERVICE]`
- NEVER expose stack traces
- NEVER expose SQL queries
- NEVER expose internal file paths
- Use correct HTTP status codes (400, 401, 403, 404, 429, 500)

---

## 2. Frontend Error Handling

### Error Boundaries
```jsx
// Wrap each route
<ErrorBoundary fallback={<ErrorPage />}>
  <DiscoverPage />
</ErrorBoundary>
```

### API Call Handling
```jsx
const { data, isLoading, error } = useQuery({
  queryKey: ['repos'],
  queryFn: fetchRepos,
});

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error.message} />;
if (!data?.length) return <EmptyState />;
```

### Rules
- ALWAYS show loading states
- ALWAYS show error states
- ALWAYS show empty states
- NEVER show blank white pages
- NEVER silently swallow errors

---

## 3. Error Logging

### Backend Format
```javascript
console.error('[AUTH] Login error:', err.message);
console.error('[DB] Query failed:', err.message);
console.error('[ADMIN] Telemetry error:', err.message);
```

### Forbidden Logs
- Passwords or password hashes
- Session IDs
- Authentication tokens
- Full request bodies (may contain secrets)

---

## 4. Network Errors

```javascript
// Client-side timeout
const response = await fetch(url, {
  signal: AbortSignal.timeout(10000),
});

// Client-side retry
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetch(url);
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * 2 ** i));
    }
  }
}
```

---

## 5. Database Errors

```javascript
try {
  await db.query('SELECT * FROM "User" WHERE id = $1', [userId]);
} catch (err) {
  console.error('[DB] Query error:', err.message);
  res.status(500).json({ error: true, message: 'Operation failed.' });
}
```

### Error Codes
| Code | Meaning | Action |
|---|---|---|
| 42701 | Duplicate column | Suppress (migration) |
| 23505 | Unique violation | Return 409 Conflict |
| 23503 | FK violation | Return 400 Bad Request |
| 42P01 | Relation not found | Check table name quoting |

---

## 6. Validation Errors

```javascript
// Zod validation
try {
  const result = schema.parse(req.body);
} catch (err) {
  return res.status(400).json({
    error: true,
    message: 'Invalid input.',
    details: err.errors,  // Only in dev
  });
}

// Manual validation
if (!email) {
  return res.status(400).json({ error: true, message: 'Email is required.' });
}
```

---

## 7. Authentication Errors

```javascript
// Generic message (prevents enumeration)
return res.status(401).json({ error: true, message: 'Invalid email or password.' });

// Account locked
return res.status(423).json({ error: true, message: 'Account locked. Try again later.' });

// Email not verified
return res.status(403).json({ error: true, message: 'Please verify your email.' });
```

---

## 8. Rate Limit Errors

```javascript
return res.status(429).json({
  error: true,
  message: 'Too many attempts. Try again later.',
});
```

---

## 9. Enforcement

- All async handlers must have try/catch
- All errors must be logged with service prefix
- All user-facing errors must be friendly messages
- Code review must verify no stack traces leak

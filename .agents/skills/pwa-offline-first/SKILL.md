---
name: pwa-offline-first
description: "PWA and offline-first skill for Openlysts. Covers service worker strategies, cache invalidation, manifest configuration, offline fallback UI, and background sync patterns."
---

# PWA & Offline-First Skill

## Role & Identity
PWA Engineer ensuring Openlysts works reliably offline and on flaky connections. Users should never lose data or see broken pages.

---

## 1. Web App Manifest

```json
{
  "name": "Openlysts — Discover Open-Source Projects",
  "short_name": "Openlysts",
  "description": "Explore, compare, and discover open-source projects",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#09090b",
  "theme_color": "#10b981",
  "orientation": "any",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### HTML Link
```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#10b981" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<link rel="apple-touch-icon" href="/icon-192.png" />
```

---

## 2. Service Worker Strategies

### Cache-First (Static Assets)
```javascript
// For JS, CSS, fonts — immutable once built
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/assets/')) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});
```

### Network-First (API Data)
```javascript
// For API calls — prefer network, fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open('api-cache').then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
```

### Stale-While-Revalidate (HTML)
```javascript
// For HTML pages — serve cached, update in background
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.open('pages').then(async cache => {
        const cached = await cache.match(event.request);
        const fetchPromise = fetch(event.request).then(response => {
          cache.put(event.request, response.clone());
          return response;
        });
        return cached || fetchPromise;
      })
    );
  }
});
```

---

## 3. Offline Fallback UI

```javascript
// In service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('offline-v1').then(cache => {
      return cache.addAll([
        '/',
        '/offline.html',
        '/assets/app.css',
        '/assets/app.js',
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match('/offline.html');
      }
    })
  );
});
```

### Offline Page
```html
<!-- public/offline.html -->
<main class="flex items-center justify-center min-h-screen">
  <div class="text-center">
    <WifiOff class="w-12 h-12 mx-auto text-muted-foreground" />
    <h1 class="mt-4 text-xl font-semibold">You're offline</h1>
    <p class="mt-2 text-muted-foreground">
      Check your internet connection and try again.
    </p>
    <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded">
      Retry
    </button>
  </div>
</main>
```

---

## 4. Client Outbox Sync (Openlysts Pattern)

```javascript
// src/lib/syncOutbox.js
const OUTBOX_KEY = 'openlyst_sync_outbox';

export function addToOutbox(action) {
  const outbox = JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]');
  outbox.push({ ...action, id: crypto.randomUUID(), timestamp: Date.now() });
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
}

export async function syncOutbox() {
  const outbox = JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]');
  if (outbox.length === 0) return;

  const synced = [];
  for (const action of outbox) {
    try {
      await fetch(action.url, {
        method: action.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.body),
      });
      synced.push(action.id);
    } catch {
      break; // Stop on first failure, retry later
    }
  }

  const remaining = outbox.filter(a => !synced.includes(a.id));
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(remaining));
}

// Sync when online
window.addEventListener('online', syncOutbox);
// Sync periodically
setInterval(syncOutbox, 30000);
```

---

## 5. Cache Invalidation

### Version-Based
```javascript
const CACHE_VERSION = 'v2';
self.addEventListener('install', () => {
  caches.keys().then(keys => {
    keys.filter(k => k !== CACHE_VERSION).forEach(k => caches.delete(k));
  });
});
```

### Tag-Based
```javascript
// When data changes, invalidate related cache
async function invalidateCache(tag) {
  const cache = await caches.open('api-cache');
  const keys = await cache.keys();
  for (const request of keys) {
    const response = await cache.match(request);
    if (response?.headers?.get('sw-cache-tag') === tag) {
      await cache.delete(request);
    }
  }
}
```

---

## 6. Background Sync

```javascript
// Register background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bookmarks') {
    event.waitUntil(syncOutbox());
  }
});

// Trigger sync from client
if ('serviceWorker' in navigator && 'SyncManager' in window) {
  const reg = await navigator.serviceWorker.ready;
  await reg.sync.register('sync-bookmarks');
}
```

---

## 7. Testing Offline Behavior

### DevTools Simulation
1. Chrome DevTools → Network tab
2. Select "Offline" from throttling dropdown
3. Test: bookmarks, search, navigation
4. Reconnect → verify sync

### Playwright Test
```javascript
await page.context().setOffline(true);
await page.reload();
// Verify offline banner appears
// Verify cached content loads
await page.context().setOffline(false);
// Verify sync completes
```

---

## 8. Verification Checklist

- [ ] `manifest.json` valid and linked in HTML
- [ ] Service worker registers without errors
- [ ] Static assets cached (cache-first)
- [ ] API data cached with fallback (network-first)
- [ ] Offline page shown when no cache available
- [ ] Bookmarks work offline (localStorage)
- [ ] Outbox syncs when reconnected
- [ ] Cache invalidated on version bump
- [ ] No stale data served after updates

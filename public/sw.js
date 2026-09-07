// Openlysts PWA Service Worker v1.1.0
const CACHE_NAME = 'openlysts-v1.1.0';
const OFFLINE_URLS = [
  '/',
  '/discover',
  '/collections',
  '/trending',
  '/alternatives',
  '/manifest.json',
  '/logo.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/apple-touch-icon.png'
];


self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS).catch((err) => {
        console.warn('[SW] Cache addAll skipped failed assets:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Strictly only intercept same-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Bypass API endpoints and local Vite dev server modules/deps
  if (
    event.request.url.includes('/api/') ||
    self.location.hostname === 'localhost' ||
    self.location.hostname === '127.0.0.1' ||
    event.request.url.includes('/node_modules/') ||
    event.request.url.includes('/@vite/') ||
    event.request.url.includes('/@fs/') ||
    event.request.url.includes('/src/')
  ) {
    return;
  }

  // Network-First for HTML navigation to guarantee fresh deployment bundles
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match('/discover') || caches.match('/') || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
          });
        })
    );
    return;
  }

  // Cache-First with Network Revalidation for static icons / offline manifest
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Revalidate in background if not an immutable hashed asset
        if (!event.request.url.includes('/assets/')) {
          fetch(event.request).then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkRes.clone()));
            }
          }).catch(() => {});
        }
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          // Cache non-asset static files (icons, logo, manifest)
          if (!event.request.url.includes('/assets/')) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone).catch(() => {});
            });
          }
        }
        return response;
      });
    })
  );
});

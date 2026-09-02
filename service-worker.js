/**
 * LIFEHUB Service Worker
 * 
 * Provides offline-first caching strategy:
 * - Cache-first for app shell assets
 * - Network-first with fallback for dynamic content
 * - Automatic cleanup of old cache versions
 * - Immediate activation and client claiming for faster updates
 */

const CACHE_NAME = 'lifehub-v7';

// App shell assets to cache on install
const SHELL_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/database.js',
  './js/ui-complete.js',
  './js/metadata-form.js',
  './js/utils.js',
  './manifest.webmanifest'
];

/**
 * Install event: Cache app shell assets and activate immediately
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => {
        console.log('[SW] Install: Cached app shell assets');
        self.skipWaiting(); // Activate immediately without waiting
      })
      .catch((error) => console.error('[SW] Install failed:', error))
  );
});

/**
 * Activate event: Clean up old cache versions and claim all clients
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Delete all caches except the current version
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name.startsWith('lifehub-'))
            .map((name) => {
              console.log('[SW] Activate: Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activate: Claiming all clients');
        return self.clients.claim(); // Take control of all clients immediately
      })
  );
});

/**
 * Fetch event: Cache-first strategy with network fallback
 * 
 * Strategy:
 * 1. Check cache first
 * 2. If not cached or on network, fetch from network
 * 3. Cache successful responses
 * 4. On network failure, fall back to cached version or app shell
 */
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Try fetching from network
        return fetch(event.request)
          .then((response) => {
            // Validate response
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Cache successful responses (clone since response can only be read once)
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              })
              .catch((error) => console.error('[SW] Cache put failed:', error));

            return response;
          })
          .catch((error) => {
            // Network failed and not in cache
            console.error('[SW] Fetch failed:', error);
            
            // Return cached index.html as fallback for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            
            throw error;
          });
      })
      .catch((error) => {
        console.error('[SW] Cache operation failed:', error);
        // Last resort fallback
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html').catch(() => new Response('Offline'));
        }
      })
  );
});

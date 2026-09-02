/**
 * LIFEHUB Service Worker — V2
 * Network-first for HTML/JS/CSS so deployments update promptly;
 * cache fallback keeps the app usable offline.
 */
const CACHE_NAME = 'lifehub-v2-1';
const SHELL_ASSETS = [
  './', './index.html', './css/style.css', './css/v2.css',
  './js/app.js', './js/database.js', './js/ui-complete.js', './js/metadata-form.js', './js/utils.js',
  './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((name) => name.startsWith('lifehub-') && name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isAppAsset = url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.html') || event.request.mode === 'navigate';

  event.respondWith((async () => {
    if (isAppAsset) {
      try {
        const response = await fetch(event.request, { cache: 'no-store' });
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, response.clone());
        }
        return response;
      } catch {
        return (await caches.match(event.request)) || (await caches.match('./index.html'));
      }
    }

    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch {
      return caches.match('./index.html');
    }
  })());
});

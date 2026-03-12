/* Tony's Healthtrack — Service Worker
   Cache-first strategy: serve from cache instantly, update in background */

const CACHE_NAME = 'tonys-health-v1';
const ASSETS = [
  './',
  './index.html'
];

// Install: pre-cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()) // activate immediately
  );
});

// Activate: delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim()) // take control immediately
  );
});

// Fetch: cache-first, fall back to network, update cache in background
self.addEventListener('fetch', event => {
  // Only handle GET requests for our own origin
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      // Serve cached version instantly
      const networkFetch = fetch(event.request).then(response => {
        // Update cache with fresh version in background
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => null);

      // Return cache immediately if available, else wait for network
      return cached || networkFetch;
    })
  );
});

const CACHE_NAME = 'plantube-shell-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for API calls and non-GET requests
  if (url.pathname.startsWith('/api/') || request.method !== 'GET') {
    return;
  }

  // Network-First Strategy: Try network, fallback to cache
  event.respondWith(
    fetch(request)
      .then(async (response) => {
        // Successful response: Update cache and return
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
        }
        return response;
      })
      .catch(async () => {
        // Network failed (offline): Serve from cache if available
        const cached = await caches.match(request);
        if (cached) return cached;

        // Special case for navigation: Return index.html from cache
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        
        return Response.error();
      })
  );
});
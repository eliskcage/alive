/* ALIVE Service Worker — Offline capability + caching */
var CACHE = 'alive-v3.1';
var URLS = [
  '/alive/',
  '/alive/index.html',
  '/alive/manifest.json',
  '/alive/icon-192.svg',
  '/alive/icon-512.svg'
];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(cache) {
    return cache.addAll(URLS);
  }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(response) {
        /* Cache new resources on the fly */
        if (response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        }
        return response;
      }).catch(function() {
        /* Offline fallback — return cached index */
        if (e.request.mode === 'navigate') return caches.match('/alive/index.html');
      });
    })
  );
});

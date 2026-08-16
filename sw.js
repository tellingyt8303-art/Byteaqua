const CACHE_NAME = 'aquaflow-v1';
const SHELL_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/api.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Never cache API calls — always go to network for live data
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ success: false, message: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // App shell: cache-first, fall back to network
  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request)
          .then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
          .catch(() => caches.match('./index.html'))
      );
    })
  );
});

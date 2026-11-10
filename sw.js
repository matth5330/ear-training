const CACHE = 'eartrain-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/theory.js',
  './js/audio.js',
  './js/adaptive.js',
  './js/exercises.js',
  './js/app.js',
  './icons/icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first: serve from cache, fall back to network
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

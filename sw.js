const CACHE_NAME = 'snack-drink-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/images/SD_logo.png',
  '/images/BANNER.png',
  '/images/logoDS.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

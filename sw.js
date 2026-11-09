/* GotSpotKe – service worker: keeps the app working with a weak or no connection.
 * Bump VERSION whenever you change any file so phones pick up the new version.
 */
var VERSION = 'gsk-v2';
var FILES = [
  './',
  './index.html',
  './simulator.html',
  './css/styles.css',
  './js/data.js',
  './js/i18n.js',
  './js/engine.js',
  './js/app.js',
  './js/simulator.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(VERSION).then(function (cache) { return cache.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

// Network first, fall back to the saved copy when offline.
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).then(function (res) {
      if (res && res.ok && new URL(event.request.url).origin === self.location.origin) {
        var copy = res.clone();
        caches.open(VERSION).then(function (cache) { cache.put(event.request, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(event.request).then(function (hit) { return hit || caches.match('./index.html'); });
    })
  );
});

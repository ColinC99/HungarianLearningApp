// Offline support. Bump VERSION whenever any file changes so phones pick up the update.
const VERSION = '1.0.0';
const CACHE = `szokincs-${VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/main.js',
  './js/deck.js',
  './js/scheduler.js',
  './js/store.js',
  './js/util.js',
  './js/check.js',
  './js/speech.js',
  './js/icons.js',
  './data/vocab-1.js',
  './data/vocab-2.js',
  './data/vocab-3.js',
  './data/vocab-4.js',
  './data/grammar.js',
  './data/verbs.js',
  './data/confusables.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('szokincs-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok && res.type === 'basic') cache.put(req, res.clone());
        return res;
      } catch (e) {
        if (req.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
        return Response.error();
      }
    }),
  );
});

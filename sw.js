const CACHE = 'exodologio-v3';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'vendor/jspdf.umd.min.js', 'vendor/pdf.min.js', 'vendor/pdf.worker.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Network first for the page (to pick up updates), cache first for everything else.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.mode === 'navigate') {
    // If the site is offline or no longer published (404), keep using the cached copy.
    e.respondWith(fetch(e.request)
      .then(r => {
        if (!r.ok) return caches.match('index.html').then(c => c || r);
        const copy = r.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); return r;
      })
      .catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

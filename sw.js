const CACHE = 'fuelpass-v3';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'guide.html', 'Fuelpass-Odigos.pdf',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'vendor/jspdf.umd.min.js', 'vendor/pdf.min.js', 'vendor/pdf.worker.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
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
    // Pages (the app and the in-app guide): always revalidate with the server, skipping the
    // browser's HTTP cache, so updates show up on the next open. Offline or 404: use the cached copy.
    const key = e.request.url.split(/[?#]/)[0];
    const cached = () => caches.match(key).then(c => c || caches.match('index.html'));
    e.respondWith(fetch(key, { cache: 'no-cache', credentials: 'same-origin' })
      .then(r => {
        if (!r.ok) return cached().then(c => c || r);
        const copy = r.clone(); caches.open(CACHE).then(c => c.put(key, copy)); return r;
      })
      .catch(cached));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

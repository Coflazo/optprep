// OptPrep offline cache. The Pages workflow replaces the build marker below with the
// commit SHA, so every deploy gets its own cache; an unreplaced copy uses 'dev'.
// Kill switch: if this file is ever replaced by one whose install calls skipWaiting(),
// whose activate deletes every cache and calls self.registration.unregister(), and
// which has no fetch handler, installed clients recover on their next visit.
const BUILD = '__BUILD__';
const CACHE = `optprep-${BUILD.startsWith('__') ? 'dev' : BUILD}`;
const PRECACHE = ['index.html', 'app.js', 'manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('optprep-') && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

// The page asks for this when the reader accepts the update notice.
self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.split('/').includes('api')) return; // the local backend is never cached
  const media = req.destination === 'image' || req.destination === 'font' || /\.(png|svg|ico|woff2?)$/i.test(url.pathname);
  event.respondWith(media ? cacheFirst(event) : networkFirst(event));
});

async function store(event, res) {
  if (res.status === 200) {
    const cache = await caches.open(CACHE);
    event.waitUntil(cache.put(event.request, res.clone()));
  }
  return res;
}

// Code and pages: always the current version when online, the cached one when offline.
async function networkFirst(event) {
  const req = event.request;
  try {
    return await store(event, await fetch(req));
  } catch (err) {
    const nav = req.mode === 'navigate';
    const hit = (await caches.match(req, { ignoreSearch: nav })) || (nav && (await caches.match('index.html')));
    if (hit) return hit;
    throw err;
  }
}

async function cacheFirst(event) {
  return (await caches.match(event.request)) || store(event, await fetch(event.request));
}

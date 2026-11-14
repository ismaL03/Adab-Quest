// Cache hors ligne : la page en « réseau d'abord », le reste (fichiers versionnés) en « cache d'abord ».
const CACHE = 'siraj-v1'
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return
  const put = (res) => {
    if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()))
    return res
  }
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(put).catch(() => caches.match(req).then((r) => r || caches.match('./'))))
  } else {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then(put)))
  }
})

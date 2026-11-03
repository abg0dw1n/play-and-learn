// Offline support: always try the network first (so updates show up right away),
// fall back to the last copy we saw when there's no internet.
// Only this site's own files are cached; the Google font can't be (the browser hides its
// contents from us), so offline it falls back to the built-in rounded font.
const CACHE = 'playlearn-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Voice clips are never changed once made (their names come from their text), and phones fetch them in
  // pieces, so let the browser's own cache handle them.
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/audio/')) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('/'))),
  );
});

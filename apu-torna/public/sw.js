/* Egyszerű offline gyorsítótár: az app mindig a legfrissebb verziót kéri, de ha nincs net, a mentettet mutatja. */
var CACHE = 'apu-torna-v1';
var SHELL = ['./', 'index.html', 'style.css', 'exercises.js', 'engine.js', 'phrases.js', 'figures.js', 'store.js', 'voice.js', 'mountain.js', 'app.js', 'icon.svg', 'manifest.webmanifest'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.indexOf('/api/') >= 0) return;
  if (u.pathname.indexOf('/media/') >= 0) {
    // hangfelvételek: verziószámos URL, mehet a gyorsítótárból
    e.respondWith(caches.open(CACHE).then(function (c) {
      return c.match(e.request).then(function (hit) {
        return hit || fetch(e.request).then(function (r) { if (r.ok) c.put(e.request, r.clone()); return r; });
      });
    }));
    return;
  }
  e.respondWith(fetch(e.request).then(function (r) {
    if (r.ok) { var cl = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cl); }); }
    return r;
  }).catch(function () { return caches.match(e.request, { ignoreSearch: true }); }));
});

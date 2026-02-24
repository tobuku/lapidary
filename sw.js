const CACHE = "lapidary-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/listings.html",
  "/listing.html",
  "/categories.html",
  "/locations.html",
  "/submit.html",
  "/about.html",
  "/contact.html",
  "/privacy.html",
  "/assets/css/base.css",
  "/assets/js/app.js",
  "/assets/js/search.js",
  "/assets/js/listings.js",
  "/assets/js/listing.js",
  "/assets/js/schema.js",
  "/data/listings.json",
  "/data/categories.json",
  "/data/states.json",
  "/assets/img/logo.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((cache) => cache.put(req, copy));
      return res;
    }).catch(() => cached))
  );
});

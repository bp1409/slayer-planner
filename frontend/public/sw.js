const CACHE_NAME = "__CACHE_NAME__";
const PRECACHE_URLS = __PRECACHE_URLS__;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith("slayer-planner-") && key !== CACHE_NAME).map((key) => caches.delete(key)),
  )).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  const requestUrl = new URL(event.request.url);
  const isNavigation = event.request.mode === "navigate" || requestUrl.pathname.endsWith("/index.html");
  const isHashedAsset = requestUrl.pathname.includes("/assets/");

  if (isNavigation) {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.clone();
      void caches.open(CACHE_NAME).then((cache) => cache.put(new URL("./index.html", self.registration.scope).href, copy));
      return response;
    }).catch(() => caches.match(event.request).then((cached) => cached ?? caches.match("./").then((root) => root ?? caches.match(new URL("./index.html", self.registration.scope).href)))));
    return;
  }

  if (isHashedAsset) {
    event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request)));
  }
});

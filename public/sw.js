/**
 * ZAIN SUPER MART — Production Service Worker
 * Full offline-first PWA with app shell caching
 */

const CACHE_VERSION = "zsm-v4";
const STATIC_CACHE = CACHE_VERSION + "-static";
const DYNAMIC_CACHE = CACHE_VERSION + "-dynamic";
const API_CACHE = CACHE_VERSION + "-api";

// Core app shell files to precache
const APP_SHELL = [
  "/",
  "/login",
  "/dashboard",
  "/pos",
  "/products",
  "/categories",
  "/inventory",
  "/customers",
  "/suppliers",
  "/purchases",
  "/expenses",
  "/reports",
  "/settings",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/offline",
];

// Install: precache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      // Cache each URL individually, skip failures
      for (const url of APP_SHELL) {
        try {
          await cache.add(url);
        } catch (e) {
          console.warn("SW: Failed to cache", url, e);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // API requests: network-first with cache fallback (for offline product data)
  if (url.pathname.startsWith("/api/")) {
    // Cache GET API responses for offline use
    if (
      url.pathname.includes("/products") ||
      url.pathname.includes("/categories") ||
      url.pathname.includes("/customers") ||
      url.pathname.includes("/stats")
    ) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(API_CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => caches.match(request))
      );
      return;
    }
    // Other API calls: network only
    return;
  }

  // Next.js static assets: cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.json"
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // Next.js dynamic chunks: stale-while-revalidate
  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // HTML pages: network-first, fallback to cache, then offline page
  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          // Fallback to offline page
          const offline = await caches.match("/offline");
          if (offline) return offline;
          // Last resort: try dashboard
          const dashboard = await caches.match("/dashboard");
          return dashboard || new Response("Offline", { status: 503 });
        })
    );
    return;
  }

  // Everything else: network with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Listen for sync events
self.addEventListener("sync", (event) => {
  if (event.tag === "zsm-sync-sales") {
    event.respondWith(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage({ type: "SYNC_SALES" }));
      })
    );
  }
});

// Listen for messages
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

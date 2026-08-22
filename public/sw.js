/**
 * ZAIN SUPER MART — Offline-first Service Worker
 * Supabase is authoritative; this worker caches the installed app shell and read data.
 */

const VERSION = "zsm-v5";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const DATA_CACHE = `${VERSION}-data`;
const ASSET_CACHE = `${VERSION}-assets`;

const PUBLIC_SHELL = [
  "/login",
  "/offline",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

const AUTHENTICATED_SHELL = [
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
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      for (const path of PUBLIC_SHELL) {
        try {
          const response = await fetch(path, { credentials: "include" });
          if (response.ok) await cache.put(path, response);
        } catch {
          // One missing asset must not prevent service-worker installation.
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)))
      ),
      self.clients.claim(),
    ])
  );
});

async function cacheAuthenticatedShell() {
  const cache = await caches.open(PAGE_CACHE);
  for (const path of AUTHENTICATED_SHELL) {
    try {
      const response = await fetch(path, {
        credentials: "include",
        redirect: "follow",
        headers: { "X-ZSM-Cache-Warm": "1" },
      });
      // Never cache a response redirected to login under a protected page key.
      if (response.ok && !response.url.includes("/login")) {
        await cache.put(path, response.clone());
      }
    } catch {
      // Existing cached shell remains available.
    }
  }
}

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  if (event.data?.type === "CACHE_AUTHENTICATED_SHELL") {
    event.waitUntil(cacheAuthenticatedShell());
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === "zsm-sync-sales") {
    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: "SYNC_SALES" }));
      })
    );
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/")) {
    const cacheableRead = ["/api/products", "/api/categories", "/api/customers", "/api/stats"]
      .some((prefix) => url.pathname.startsWith(prefix));
    if (!cacheableRead) return;

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(DATA_CACHE).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(async () =>
          (await caches.match(request)) ||
          new Response(JSON.stringify({ error: "Offline data is unavailable" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          })
        )
    );
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.json"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) caches.open(ASSET_CACHE).then((cache) => cache.put(request, response.clone()));
          return response;
        });
      })
    );
    return;
  }

  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response.ok) caches.open(ASSET_CACHE).then((cache) => cache.put(request, response.clone()));
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && !response.url.includes("/login")) {
            caches.open(PAGE_CACHE).then((cache) => cache.put(url.pathname, response.clone()));
          }
          return response;
        })
        .catch(async () => {
          const exact = await caches.match(url.pathname);
          if (exact) return exact;
          const offline = await caches.match("/offline");
          return offline || new Response("ZAIN SUPER MART is offline", { status: 503 });
        })
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) caches.open(ASSET_CACHE).then((cache) => cache.put(request, response.clone()));
        return response;
      })
      .catch(() => caches.match(request))
  );
});

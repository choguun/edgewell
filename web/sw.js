// EdgeWell service worker. v3.0.1.
//
// Caches the static shell (HTML, CSS, JS, manifest, icon) so the
// phone-as-companion story still loads when the device is briefly
// offline — e.g. when the user opens the home-screen icon before
// the desktop companion has finished waking up.
//
// Network requests for non-shell URLs (the companion's /chat,
// /journal, /expenses, /health) are never cached; the page does
// its own token-aware fetch with a clean error UI when the peer
// is down.
//
// Bump CACHE_NAME on every release so older cached shells are
// evicted in a single `activate` pass.

const CACHE_NAME = "edgewell-shell-v3.0.1";
const SHELL = [
  "./",
  "./index.html",
  "./app.js",
  "./style.css",
  "./manifest.webmanifest",
  "./icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // addAll is atomic: if any URL 404s the install fails.
      // Use individual put()s so a missing optional file does
      // not brick the whole worker.
      await Promise.all(
        SHELL.map(async (url) => {
          try {
            const res = await fetch(url, { cache: "no-cache" });
            if (res.ok) await cache.put(url, res.clone());
          } catch {
            // ignore — partial shell is better than no install
          }
        }),
      );
      self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // never cache mutations
  const url = new URL(req.url);
  // Bypass cross-origin and any path that looks like an API call.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/chat") ||
      url.pathname.startsWith("/journal") ||
      url.pathname.startsWith("/expenses") ||
      url.pathname.startsWith("/profile") ||
      url.pathname.startsWith("/health")) {
    return; // let the page handle auth + errors
  }
  // Cache-first for shell assets, network-first for everything
  // else on the same origin (so dev-mode edits are picked up).
  event.respondWith(
    (async () => {
      const cached = await caches.match(req, { ignoreSearch: true });
      if (cached) return cached;
      try {
        const res = await fetch(req);
        return res;
      } catch {
        // Last-ditch SPA fallback: if the user is offline and
        // navigates to an unknown path, serve the cached shell
        // so they at least see the page chrome.
        if (req.mode === "navigate") {
          const shell = await caches.match("./index.html");
          if (shell) return shell;
        }
        return new Response("offline", { status: 503, statusText: "offline" });
      }
    })(),
  );
});

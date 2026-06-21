// EdgeWell service worker. v3.2.0-demo.
//
// Caches the static shell and, when the app is running inside the
// Android APK, intercepts requests to `http://localhost:8787/*` and
// serves them from the in-browser fake companion server. That gives
// a zero-setup demo where the WebView thinks it is talking to the
// companion Node.js server, but everything is local.
//
// Bump CACHE_NAME on every release so older cached shells are
// evicted in a single `activate` pass.

// Load the fake server implementation into the worker context so it
// can handle localhost:8787 requests offline. It self-registers on
// `self.EdgeWellFakeServer`.
try {
  importScripts("./fake-server.js");
} catch (err) {
  console.warn("[sw] failed to load fake-server.js", err);
}

const CACHE_NAME = "edgewell-shell-v3.2.0-demo";
const SHELL = [
  "./",
  "./index.html",
  "./app.js",
  "./fake-server.js",
  "./style.css",
  "./manifest.webmanifest",
  "./icon.svg",
  "./markdown.js",
  "./store.js",
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

function isLocalhostCompanion(url) {
  return (
    url.hostname === "localhost" &&
    url.port === "8787" &&
    (url.pathname.startsWith("/chat") ||
      url.pathname.startsWith("/journal") ||
      url.pathname.startsWith("/expenses") ||
      url.pathname.startsWith("/profile") ||
      url.pathname.startsWith("/health"))
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Intercept localhost:8787 companion API calls and serve them from
  // the fake server. This only happens in the native APK context where
  // the WebView has been pointed at the local address.
  if (isLocalhostCompanion(url) && self.EdgeWellFakeServer) {
    event.respondWith(self.EdgeWellFakeServer.handleRequest(req));
    return;
  }

  // Never cache API calls or mutations.
  if (req.method !== "GET") return;
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

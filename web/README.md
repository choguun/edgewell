# EdgeWell Web UI

Static, installable front-end for the EdgeWell companion server.
Three-column layout on desktop, tab-bar on mobile, no build step,
no framework.

## Run locally

1. Start the companion server in another terminal:

   ```bash
   edgewell companion --port 8787
   ```

   The companion now serves the `web/` directory itself, so a
   phone pointed at `http://<desktop-ip>:8787/` Just Works.
   The original "open the page separately" workflow still
   applies for development:

   ```bash
   # Node (>=18)
   npx --yes serve web
   ```

2. Open `http://localhost:3000` (or whatever the static server
   prints) in your browser. The web UI talks to the companion
   server on the same host on port 8787 by default. Override
   with a query string: `http://localhost:3000/?server=http://192.168.1.5:8787`.

## Auth

If the companion server was started with a token, paste it into
the browser's `localStorage` before opening the page, or click
the 🔑 button in the header the first time the server returns
`401`:

```js
localStorage.setItem("edgewell.token", "<paste-token-here>");
```

The page then sends `Authorization: Bearer <token>` on every
request and retries once after a 401 if you paste a new token.

## PWA / install

The UI ships with `manifest.webmanifest`, `sw.js`, and an
SVG icon, so Chrome / Edge / Safari will offer
**Add to Home Screen** the first time you visit the page. Once
installed, the service worker caches the shell so the page
still renders if the device is briefly offline (the `/chat`,
`/journal`, and `/expenses` calls are still routed through the
live companion — the SW only caches the static files).

The header shows an `⤓ Install` button that hooks
`beforeinstallprompt`; on iOS Safari use the share-sheet
"Add to Home Screen" instead.

## Streaming chat

Chat goes through `POST /chat/stream` (Server-Sent Events) so
the multi-agent router chip, RAG source citations, and the
LLM's tokens all render progressively. The companion's older
`POST /chat` (buffered) is still available for scripts that
don't want SSE.

## Files

- `index.html` — 3-column layout (Journal · Chat · Expenses).
- `style.css` — dark theme, agent-coded chat bubbles, P2P dot,
  inline expense chart, mobile tab bar.
- `app.js` — vanilla JS, no build step. Handles streaming,
  auth, install prompt, service-worker registration, and
  tab bar.
- `manifest.webmanifest` — PWA manifest with icons and
  shortcuts for Chat and Journal.
- `sw.js` — minimal cache-first service worker, version-busted
  via `CACHE_NAME`.
- `icon.svg` — single SVG icon used by the manifest and as
  the apple-touch-icon.

# EdgeWell Web UI

Tiny static front-end for the EdgeWell companion server.

## Run locally

1. Start the companion server in another terminal:

   ```bash
   edgewell companion --port 8787
   ```

2. Serve the `web/` directory with any static file server. Examples:

   ```bash
   # Node (>=18)
   npx --yes serve web
   ```

3. Open `http://localhost:3000` (or whatever the static server
   prints) in your browser. The web UI talks to the companion server
   on the same host on port 8787 by default. Override with a query
   string: `http://localhost:3000/?server=http://192.168.1.5:8787`.

## Auth

If the companion server was started with a token, paste it into the
browser's `localStorage` before opening the page:

```js
localStorage.setItem("edgewell.token", "<paste-token-here>");
```

The page will then send `Authorization: Bearer <token>` on every
request.

## Files

- `index.html` — chat + journal layout.
- `style.css` — dark theme, no framework.
- `app.js` — small client, no build step.

# EdgeWell Example Plugins

This directory contains example v3.0.0 plugins. Each one
demonstrates a different hook.

## Function-style (v2.0.0) plugins

- `sleep.plugin.js` — registers a SleepAgent and a custom
  `log_sleep` tool. The original v2.0.0 example.

## Object-style (v3.0.0) plugins

- `nutrition.plugin.js` — `registerAgent` hook wrapping
  `NutritionAgent`.
- `hydration.plugin.js` — `registerAgent` hook wrapping
  `HydrationAgent`.
- `activity.plugin.js` — `registerAgent` hook wrapping
  `ActivityAgent`.
- `sleep-v3.plugin.js` — `registerAgent` hook wrapping
  `SleepAgent`.
- `embedder-hash.plugin.js` — `registerEmbedder` hook exposing a
  64-dim hash embedder under the name `hash64`.
- `companion-token.plugin.js` — `registerRoute` hook adding a
  `/token` endpoint that mints bearer tokens.
- `v3-stats.plugin.js` — `onLoad` hook logging version and data
  directory.
- `rag-stats.plugin.js` — `onLoad` hook logging RAG chunk
  distribution.
- `export-md.plugin.js` — `registerRoute` hook exposing
  `/journal.md`.
- `heartbeat.plugin.js` — `registerRoute` hook exposing
  `/heartbeat` for liveness checks.
- `summary-daily.plugin.js` — `registerRoute` hook exposing
  `/summary/daily`.

## Running a plugin

```bash
EDGEWELL_PLUGINS=./examples/plugins node bin/edgewell.js status
```

Combine multiple directories with `:` (POSIX) or `;` (Windows).

## Writing your own

See `docs/PLUGINS.md` for the hook reference. A v3.0.0 plugin
exports a default object with `name`, `version`, and `hooks`.
The hook functions are called in this order:

1. `onLoad`
2. `registerEmbedder`
3. `registerAgent`
4. `registerRoute`

Errors thrown by a hook are caught and recorded against the
plugin in the load report; they do not crash EdgeWell.

# Code Review — EdgeWell v3.0.0

**Reviewer:** code-reviewer (MiniMax-M3)
**Date:** 2026-06-17
**Branch / commit:** `chore/ts-pnpm-migration` @ `9a17098` (dirty working tree)
**Scope:** Part A (3-file working-tree diff) + Part B (UAT-blocker source files)
**Severity threshold:** warnings+ (Critical + Warning; Suggestions only if cheap+high-value)
**Inputs reviewed:** `UAT-REPORT.md` (just-completed third UAT pass) + `uat-findings.json`

> **One-line verdict:** **REQUEST CHANGES.** Two real bugs (CORS missing in companion; `rotate-secret` documented but unwired) and one critical UX hole (the bundled `web/` UI cannot authenticate against the companion server out-of-the-box). The UAT-classified "endpoints don't exist" is misdiagnosed — they do exist; the test failed to authenticate. Working-tree diff itself is fine.

---

## Files Reviewed

### Part A — Working tree diff (3 files, small)

| File | Lines | What changed |
|---|---|---|
| `README.md` | +1 (line 148) | Adds `EDGEWELL_DATA_DIR` row to the env-var config table |
| `src/config.ts` | +1 (line 131) | Adds `process.env.EDGEWELL_DATA_DIR` override inside `loadConfig()` |
| `test/seed-integration.test.ts` | NEW, 104 lines | End-to-end integration test for the `seed` command on real on-disk `JsonlStore`s |

### Part B — UAT-blocker source files (pre-existing, in HEAD)

| File | Lines | Role |
|---|---|---|
| `src/companion/server.ts` | 110 | Companion HTTP server entry — `buildRouter()` + `startCompanion()` |
| `src/companion/router.ts` | 144 | Tiny dependency-free router (add/get/post + body parser + per-route timeout) |
| `src/companion/auth.ts` | 65 | HMAC-SHA256 bearer token (signToken / verifyToken / newSecret) |
| `src/companion/index.ts` | 6 | Barrel |
| `src/companion/mdns.ts` | (not opened) | mDNS announcement stub |
| `src/commands/companion.ts` | 44 | `edgewell companion` subcommand wiring |
| `src/p2p.ts` | 247 | `startServer`, `PeerClient`, `DelegatingLLM` |
| `src/commands/ask.ts` | 13 | `edgewell ask "<q>"` → `ew.orchestrator.ask(q)` |
| `src/commands/chat.ts` | 65 | `edgewell chat` → `ew.orchestrator.streamAsk(q, history)` |
| `src/qvac.ts` | 145 | `EdgeWellLLM` wrapper around `@qvac/sdk` |
| `src/index.ts` | 51 | `createEdgeWell()` factory — chooses `DelegatingLLM` when `cfg.p2p.enabled` |
| `src/dispatch.ts` | 425+ | Command router — **does not import `rotate-secret`** |
| `src/commands/rotate-secret.ts` | 18 | `edgewell rotate-secret` implementation — **exists but unwired** |
| `web/app.js` | 105 | Bundled static UI — calls `/health`, `/chat`, `/journal`, `/journal?limit=20` |
| `web/index.html` | (not opened in depth) | Page shell |

---

## Critical (must fix)

### CRIT-1 — `rotate-secret` command is documented but not dispatched (Part B, UAT was right)

- **Where:** `src/dispatch.ts:1-95` (imports) and `src/dispatch.ts:200-300` (the `commands` object/map — not all entries shown)
- **Evidence:** `src/commands/rotate-secret.ts` exists, exports `rotateSecretCommand`, is **not** imported anywhere in `src/`. `grep -n 'rotate-secret\|rotateSecret\|rotate_secret' src/dispatch.ts` returns zero matches.
- **Impact:** Running `edgewell rotate-secret` returns `unknown command: rotate-secret` and exit 2, exactly as the UAT reported (UAT-FN-07). `docs/COMMANDS.md:72` advertises the command. Doc/code drift that ships a broken command reference.
- **Suggested fix (one-line in `src/dispatch.ts`):**
  ```ts
  import { rotateSecretCommand } from "./commands/rotate-secret.js";
  // ... and in the commands map ...
  "rotate-secret": rotateSecretCommand,
  ```
  Verify the file is then picked up by `pnpm build` and `edgewell rotate-secret` writes a fresh secret to `~/.edgewell/secret`. This is exactly the regression-guard that should be in the test suite — consider adding `test/commands-rotate-secret.test.ts` that asserts dispatch + file mode 0600.

### CRIT-2 — Companion server has no CORS handling — Part B (UAT-FN-14 was right, but the route claim was wrong)

- **Where:** `src/companion/router.ts:13-19` (the `send()` helper) and `src/companion/router.ts` `Router.handle()` (lines 65-115)
- **Evidence:**
  ```ts
  // router.ts:13
  function send(res, status, body, headers = {}) {
    res.statusCode = status;
    res.setHeader("content-type", "application/json; charset=utf-8");
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
    res.end(JSON.stringify(body));
  }
  ```
  There is no `Access-Control-Allow-Origin`, no `Access-Control-Allow-Methods`, no `Access-Control-Allow-Headers`, no OPTIONS-route registration. The router only matches `method` + `path` patterns; an OPTIONS preflight to `/chat` will hit the 404 branch.
- **Impact:** When the bundled `web/` UI is served from any origin other than the companion's own (e.g. `python3 -m http.server 8080 --directory web`, file://, or a phone browser pointed at `http://<desktop-ip>:8787`), the browser refuses to send the actual request — and in the case of a non-simple `Content-Type: application/json`, it sends an OPTIONS preflight first, which 404s. **Net effect:** the v3.0.0 mobile-companion story is broken for any real device.
- **Note on UAT-FN-09 / FN-10:** Those UAT findings are misdiagnosed — `src/companion/server.ts:30-105` registers `GET /health`, `GET /profile`, `GET /journal`, `POST /journal`, `GET /expenses`, `POST /expenses`, `POST /chat`. The bundled `web/app.js:64, 71, 84, 95` calls `/chat`, `/journal`, `/journal?limit=20`, `/health` — every URL the UI calls exists in the router. The actual reason the UAT tester saw 404s (or perceived them as 404s) is that the server, by default, requires a bearer token (`useAuth = true` in `companion.ts:14`), and the web UI has no UI to enter one. Without a token, requests get 401 — not 404. The UAT tester, staying in user-persona, may have read "missing bearer token" as "endpoint missing." See CRIT-3 for the real UX issue.
- **Suggested fix (drop-in CORS helper in `src/companion/router.ts`):**
  ```ts
  // CORS: allow the companion to be driven from a phone browser on
  // the LAN (different origin from the companion server). This is
  // safe because all companion endpoints are auth-gated by bearer
  // token; CORS alone does not grant access.
  const CORS_HEADERS = {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "authorization, content-type",
    "access-control-max-age": "600",
  };
  // Add an OPTIONS short-circuit at the top of Router.handle():
  if (method === "OPTIONS") {
    send(res, 204, "", CORS_HEADERS);
    return;
  }
  // And merge CORS_HEADERS into send()'s default headers:
  function send(res, status, body, headers = {}) {
    res.statusCode = status;
    for (const [k, v] of Object.entries({ "content-type": "application/json; charset=utf-8", ...CORS_HEADERS, ...headers })) res.setHeader(k, v);
    res.end(JSON.stringify(body));
  }
  ```
  Trade-off: `allow-origin: *` is correct here because the bearer token is the real auth. If the user wants to lock down to a specific origin, that should be a config flag, not a code change.

### CRIT-3 — Bundled `web/` UI cannot authenticate against the companion server out-of-the-box — Part B (root cause of UAT-FN-09/FN-10)

- **Where:** `web/app.js:1-3` (token load), `web/app.js:20-24` (header builder), and `src/companion/server.ts:13-21` (server's `authOr401`).
- **Evidence:**
  ```js
  // web/app.js
  const TOKEN = localStorage.getItem("edgewell.token") ?? "";
  // ...
  function headers() {
    const h = { "content-type": "application/json" };
    if (TOKEN) h.authorization = `Bearer ${TOKEN}`;
    return h;
  }
  ```
  There is no input field, no prompt, no auto-fetch of the token from `/health` (which is the only unauthenticated endpoint). If `localStorage` is empty, every authed request goes without `Authorization`, server returns 401 "missing bearer token", and the user sees `error: HTTP 401: {"error":"missing bearer token"}` in the chat. The token flow requires a manual `localStorage.setItem("edgewell.token", "...")` step in DevTools.
- **Impact:** A user who follows the v3.0.0 README ("the bundled web UI for chat and journal") and opens `web/index.html` will see every chat message and journal submission fail with a 401 they cannot fix through the UI.
- **Suggested fix (smallest viable):** Add a token prompt in `web/app.js` that triggers when `ping()` returns 401:
  ```js
  async function ensureToken() {
    if (TOKEN) return TOKEN;
    const r = await api("/health").catch(() => null);
    if (r) return TOKEN;        // server runs without auth
    const t = prompt("Companion token (paste from `edgewell companion --print-token`):", "");
    if (t) {
      localStorage.setItem("edgewell.token", t);
      location.reload();
    }
    return t;
  }
  // Call ensureToken() before any authed API call (chat submit, journal submit, loadJournal).
  ```
  Even better: have the companion command, on first start with `--print-token`, also write the token to a file the UI can fetch via a new `GET /token?setup=<one-shot-secret>` route — but that's a bigger change and probably overkill.

---

## Warnings (should fix)

### WARN-1 — `EDGEWELL_DATA_DIR` env var is read without validation — Part A

- **Where:** `src/config.ts:131`
- **Evidence:**
  ```ts
  if (process.env.EDGEWELL_DATA_DIR) cfg.data.dir = process.env.EDGEWELL_DATA_DIR;
  ```
  No type check, no normalization, no rejection of empty/whitespace/relative-with-traversal patterns.
- **Risk:** A user passing `EDGEWELL_DATA_DIR=../../etc` will have EdgeWell happily try to create `data/` under `/etc`. `JsonlStore` opens the directory with `fs.mkdir({ recursive: true })` and writes — there's no symlink check, no allow-list of parents, no refusal of paths outside `~/.edgewell` or `$PWD`.
- **Severity:** Medium. Not an arbitrary-write (the user has to set the env var themselves, so it's not an untrusted-input path), but a foot-gun for typo-driven data corruption.
- **Suggested fix:**
  ```ts
  if (process.env.EDGEWELL_DATA_DIR) {
    const v = process.env.EDGEWELL_DATA_DIR.trim();
    if (!v) {
      // empty after trim - ignore, fall back to default
    } else {
      const resolved = path.resolve(v);
      // Refuse to write into obviously sensitive roots.
      const blocked = ["/etc", "/usr", "/bin", "/sbin", "/var", "/System", "/Library"];
      if (process.getuid?.() === 0 && blocked.some((p) => resolved === p || resolved.startsWith(p + path.sep))) {
        throw new Error(`EDGEWELL_DATA_DIR=${v} resolves to a system root (${resolved}); refusing to write there`);
      }
      cfg.data.dir = resolved;
    }
  }
  ```
  (Use `path.resolve(v)` so relative paths are stable regardless of CWD — this also matches the table description "relative or absolute path".)

### WARN-2 — `test/seed-integration.test.ts` last test's name overpromises — Part A

- **Where:** `test/seed-integration.test.ts:86-94`
- **Evidence:**
  ```ts
  test("EDGEWELL_DATA_DIR override actually changes where files are written", async () => {
    const dir = await freshDataDir();
    const ew = createEdgeWell();
    assert.equal(ew.cfg.data.dir, dir, "EDGEWELL_DATA_DIR should be picked up by loadConfig");
    delete process.env.EDGEWELL_DATA_DIR;
  });
  ```
  The test name says "where files are written" but it only asserts the in-memory `ew.cfg.data.dir` matches the env var — it never actually writes a file and reads it back. The three preceding tests (`freshDataDir` → `seedCommand` → `fileLineCount`) implicitly cover the file-writing path, but this test on its own is a config-only check that wouldn't catch a bug where `loadConfig()` reads `EDGEWELL_DATA_DIR` correctly but `JsonlStore` ignores it.
- **Severity:** Low-medium. The test passes for the right reasons today, but if someone later refactors `JsonlStore` to read its own path independently of `ew.cfg`, this test won't notice.
- **Suggested fix:** Add a write-then-read assertion:
  ```ts
  await ew.journal.append({ _ts: new Date().toISOString(), text: "datadir-test", tags: [] });
  const onDisk = await fs.readFile(join(dir, "journal.jsonl"), "utf8");
  assert.match(onDisk, /datadir-test/);
  assert.equal(await fileLineCount(join(dir, "journal.jsonl")), 1);
  ```

### WARN-3 — Companion server doesn't serve the static `web/` files — Part B

- **Where:** `src/companion/server.ts:96-110`
- **Evidence:** `startCompanion()` only creates the router (`buildRouter`) and starts an `http.createServer`. There is no static-file handler for `web/`. A user who runs `edgewell companion` and points a phone at `http://<desktop-ip>:8787/` gets `404 {"error":"not found","method":"GET","path":"/"}` instead of the chat UI.
- **Impact:** Forces the user to run a *second* HTTP server (`python3 -m http.server 8080 --directory web`) on the desktop, set up CORS (CRIT-2), and explain to the user why two services are needed. Defeats the v3.0.0 pitch of "small HTTP server with HMAC bearer tokens + a static web UI."
- **Suggested fix:** Add a fallback handler in `buildRouter()` that serves files from a `webDir` option:
  ```ts
  // In buildRouter():
  r.get(/^\/(.*)$/, async ({ req, res }, groups) => {
    const rel = groups[0] ?? "index.html";
    if (rel.includes("..")) return send(res, 400, { error: "bad path" });
    const filePath = path.join(webDir, rel);
    try {
      const data = await fs.readFile(filePath);
      const mime = MIME[path.extname(filePath)] ?? "application/octet-stream";
      res.writeHead(200, { "content-type": mime });
      res.end(data);
    } catch {
      // SPA fallback: serve index.html for unknown paths
      const html = await fs.readFile(path.join(webDir, "index.html"));
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(html);
    }
  });
  ```
  Place this **after** the authed routes so `/health`, `/chat`, `/journal`, `/expenses` still take precedence.

### WARN-4 — P2P silent fallback should at least log — Part B (UAT-FN-15 misdiagnosis)

- **Where:** `src/p2p.ts:177-189` (`DelegatingLLM._withFallback`)
- **Evidence:**
  ```ts
  private async *_withFallback(body: PromptInput): AsyncIterable<string> {
    let any = false;
    try {
      for await (const tok of this.peer.stream(body)) { any = true; yield tok; }
    } catch {
      // Peer failed - fall through to local.
      any = false;
    }
    if (!any) {
      for await (const tok of this.local.stream(body)) yield tok;
    }
  }
  ```
  The fallback is **intentional and correct** (the class is documented as "tries a peer first; on failure, runs locally"). The UAT report claims "never contacts peer" — that's wrong; it does try, then falls back when the peer throws. The real issue is **silence**: when the peer throws, the user has no way to know it was attempted and failed.
- **Severity:** Low (working as designed) but a real UX nit. A user who sets `EDGEWELL_P2P_ENABLED=1` to use their desktop peer and the desktop is off will silently get the phone's tiny local model with no diagnostic.
- **Suggested fix:** Inject the `logger` and log the fallback at `warn`:
  ```ts
  private async *_withFallback(body: PromptInput): AsyncIterable<string> {
    let any = false;
    try {
      for await (const tok of this.peer.stream(body)) { any = true; yield tok; }
    } catch (err) {
      this.logger.warn("p2p peer unreachable, falling back to local", { err: String(err) });
      any = false;
    }
    if (!any) {
      for await (const tok of this.local.stream(body)) yield tok;
    }
  }
  ```
  Better: surface the peer failure as a non-fatal notice on stdout (e.g. `[p2p] peer 127.0.0.1:8787 unreachable — falling back to local model`) so the user sees it during interactive `chat`.

### WARN-5 — Companion's `parseFlags` accepts `auth: true | "true"` inconsistently — Part B

- **Where:** `src/commands/companion.ts:13-15`
- **Evidence:**
  ```ts
  const flags = parseFlags(args, { host: "127.0.0.1", port: 8787, auth: true, "print-token": false });
  const useAuth = flags.auth !== false && flags.auth !== "false";
  ```
  The default is `auth: true` but the truthy-check accepts both `true` (boolean) and `"true"` (string). The flag-value parsing convention isn't documented in `docs/COMMANDS.md`. A user typing `--auth=false` may or may not get auth disabled depending on how `parseFlags` normalizes (worth a quick `node bin/edgewell.js companion --help` check).
- **Severity:** Low — likely fine in practice but worth a test case.
- **Suggested fix:** Document in `docs/COMMANDS.md` and add `test/companion-flags.test.ts` covering `--auth`, `--no-auth`, `--auth=true`, `--auth=false`.

---

## Suggestions (consider)

### SUGG-1 — `web/app.js` should `ping()` before any authed call and surface 401 clearly — Part B
Currently `ping()` sets `els.status.textContent` on failure but doesn't differentiate 401 from network errors. Suggestion: parse `err.status === 401` and show a one-line "set your bearer token: `localStorage.setItem('edgewell.token', '...')`" hint in the status bar.

### SUGG-2 — `docs/COMMANDS.md` should be auto-generated from `src/dispatch.ts` — Part B
The doc/code drift around `rotate-secret` (CRIT-1) is the third such instance in this codebase (prior: `seed N` regression, `self-test` running zero tests). A 10-line `scripts/gen-commands-doc.ts` that walks the `commands` map in `dispatch.ts` and re-emits `docs/COMMANDS.md` would prevent the next drift. Add it to `pnpm prepare` so it runs before each `pnpm build`.

### SUGG-3 — Companion should refuse to bind on privileged ports unless `--allow-privileged` — Part B
`startCompanion({ port: 80 })` works silently. The UAT already flagged `companion --port 80` as a sabotage that should error (`EACCES` on Linux, silent on macOS). Add an explicit check: `if (port < 1024 && !flags["allow-privileged"]) throw new Error("refusing to bind privileged port ${port}")`.

### SUGG-4 — `EDGEWELL_DATA_DIR` test in `seed-integration.test.ts` should clean up the tmpdir — Part A
`freshDataDir()` uses `fs.mkdtemp` but the test never removes the tmpdir. Across `pnpm test` runs this leaves cruft in `$TMPDIR/edgewell-seed-int-*`. Add an `after` hook:
```ts
import { rm } from "node:fs/promises";
test.afterEach(async (t) => { await rm(t.context.dataDir, { recursive: true, force: true }); });
```

### SUGG-5 — `src/dispatch.ts` has 425+ lines and 95+ imports — Part B
Pure style/maintainability. The file is the single most-edited surface (every new command adds two lines). Consider moving the dispatch table to a separate `src/commands/_registry.ts` keyed by command name with auto-typed entries. Low priority but reduces merge conflicts on the big file.

---

## Pre-existing issues exposed (not in this diff, surfaced by review)

- **`web/` is shipped but cannot authenticate against its own companion server.** The static UI is a v3.0.0 deliverable that is non-functional in default configuration. This is the deepest issue behind CRIT-3.
- **`docs/COMMANDS.md` is hand-maintained** and is the source of the `rotate-secret` drift. Three drift incidents in three UAT passes — the doc is the bug, not the missing command.
- **`src/companion/router.ts` has no tests.** The router is the security boundary for the v3.0.0 mobile companion; missing test coverage on body-size cap (1 MiB), per-handler timeout (30 s), malformed-JSON handling, and the new CORS helper (after CRIT-2 fix) is a gap. A `test/router.test.ts` with cases for body-too-large (413), handler-timeout (504), handler-did-not-respond (500), and invalid-json (400) would be high-value.
- **`DelegatingLLM._withFallback` swallows the peer error.** Even after WARN-4's logging fix, the original `Error` object (including stack) is lost. Capture it: `this.logger.warn("p2p peer unreachable", { err: err instanceof Error ? { message: err.message, stack: err.stack } : String(err) })`.
- **`src/p2p.ts` peer HTTP is plaintext.** For a feature advertised as "P2P delegation" between devices on a LAN, this is fine; the moment a user runs it across an untrusted network (a coffee shop, a VPS) the prompts cross the wire in cleartext. Worth a comment in `docs/DEPLOYMENT.md` or a future `--tls` flag.

---

## Summary

The working-tree diff itself (Part A) is small and well-tested — the new `EDGEWELL_DATA_DIR` override is wired correctly and the seed-integration test catches the UAT-FN-12 regression class. Two papercuts: no input validation on the env var (WARN-1), and one of the new tests overpromises (WARN-2).

The real work is in Part B. Two of the four "Blocker" findings the UAT attributed to the companion subsystem are misdiagnosed — the routes DO exist (FN-09, FN-10), the actual blocker is that the bundled web UI has no way to authenticate against its own server (CRIT-3) and that the server sends no CORS headers for cross-origin browser clients (CRIT-2). The third real bug is that `rotate-secret` is implemented but not wired into `dispatch.ts` (CRIT-1) — the UAT was right about this one even though the routes complaint was wrong. The P2P "never contacts peer" finding (FN-15) is a UX nit — the silent fallback is intentional, but the silence should be a warn-level log.

**Recommend: REQUEST CHANGES** before merging `f027422` + the dirty tree to `main`. CRIT-1 is a 5-line fix. CRIT-2 is a 15-line fix in `router.ts` plus an `OPTIONS` short-circuit. CRIT-3 needs both a server-side (CRIT-2) and a small `web/app.js` token-prompt patch.

**Single most important fix:** Wire `rotate-secret` into `src/dispatch.ts` (one import + one map entry) — that's the cheapest blocker-grade fix in the set.

---

## Tests

- [x] Tests added for new code paths — `test/seed-integration.test.ts` covers `EDGEWELL_DATA_DIR` end-to-end + FN-12 regression class
- [ ] Tests cover edge cases — last test in the file (line 86) only checks config, not file-write (WARN-2); no test for tmpdir cleanup (SUGG-4)
- [x] Tests follow existing patterns — uses `node:test` + `node:assert/strict`, matches the style of other integration tests in `test/`
- [ ] New tests needed (not yet written):
  - `test/dispatch-rotate-secret.test.ts` — guards CRIT-1 (regression)
  - `test/router-cors.test.ts` — guards CRIT-2 fix
  - `test/web-ui-auth.test.ts` — Playwright smoke of `web/index.html` with and without auth (guards CRIT-3)
  - `test/p2p-fallback-log.test.ts` — guards WARN-4 fix
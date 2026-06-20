// @ts-nocheck
// Companion server. v3.0.0 launches a small HTTP server on a
// configurable port (default 8787) that exposes chat, journal,
// expense, and profile endpoints to a paired phone. The server is
// built on Node's built-in `http` module, the Router in
// `router.js`, and the auth tokens from `auth.js`.
//
// Usage from the CLI: `edgewell companion --port 8787 --secret ...`
// (the secret is printed once at first-run and stored locally).

import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Router, send, sseStart, sseEvent, sseEnd } from "./router.js";
import { verifyToken } from "./auth.js";

// Static MIME map for the bundled web UI. Keep it small: the
// companion only serves text, JSON, JS, CSS, and SVG.
const STATIC_MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

function authOr401(req, secret) {
  if (!secret) return { ok: true, subject: "anonymous" };
  const header = req.headers["authorization"] ?? "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return { ok: false, status: 401, body: { error: "missing bearer token" } };
  const v = verifyToken({ token: m[1], secret });
  if (!v.ok) return { ok: false, status: 401, body: { error: `auth: ${v.reason}` } };
  return { ok: true, subject: v.subject };
}

/**
 * Register a route for both GET and HEAD. v3.0.2: every
 * authed API route needs a HEAD counterpart, otherwise a
 * `curl -I /journal` (or a browser link-prefetch, or the
 * PWA install probe) leaks a 200 with the SPA shell's
 * index.html, defeating the bearer-token gate. The HEAD
 * body is omitted per RFC 9110.
 *
 * The wrapper intercepts `res.end(body)` to drop the body
 * for HEAD while keeping status/headers intact. The same
 * handler is used for both methods, so the auth check and
 * response body are written exactly once.
 */
function addGetWithHead(router, pattern, handler) {
  const wrapped = async (ctx) => {
    if ((ctx.req.method ?? "").toUpperCase() === "HEAD") {
      const origEnd = ctx.res.end.bind(ctx.res);
      ctx.res.end = (body) => {
        // Drop the body the handler would have written.
        return origEnd();
      };
    }
    return handler(ctx);
  };
  // Register HEAD first so it matches before the more
  // permissive GET in the route list (the router iterates
  // in insertion order and stops at the first match).
  router.add("HEAD", pattern, wrapped);
  router.add("GET", pattern, wrapped);
}

/**
 * Static-file handler shared by GET and HEAD. Reads the
 * file from `webDir`, sets the right MIME type, and falls
 * back to `index.html` for unknown paths (SPA routing).
 * For HEAD requests we return only the headers — the body
 * is omitted, which is what RFC 9110 requires.
 *
 * Caching: the PWA shell is version-busted in `sw.js` via
 * the cache name, so we can safely send `cache-control:
 * max-age=300` (5 min) for everything in `web/`. That
 * covers the common "user opens the page a few times in
 * one demo" case without forcing a full re-download, and
 * the SW still intercepts and serves from cache.
 */
async function staticHandler({ req, res, params }, webDir) {
  const rel = (params && params[0]) || "index.html";
  if (rel.split("/").some((s) => s === "..")) {
    return send(res, 400, { error: "bad path" });
  }
  const filePath = path.join(webDir, rel);
  const isHead = (req.method ?? "").toUpperCase() === "HEAD";
  try {
    const data = await fs.readFile(filePath);
    const mime = STATIC_MIME[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
    res.writeHead(200, {
      "content-type": mime,
      "content-length": data.length,
      "cache-control": "public, max-age=300",
    });
    res.end(isHead ? undefined : data);
  } catch {
    // SPA fallback: serve index.html for unknown paths.
    try {
      const html = await fs.readFile(path.join(webDir, "index.html"));
      res.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "content-length": html.length,
        "cache-control": "public, max-age=300",
      });
      res.end(isHead ? undefined : html);
    } catch {
      send(res, 404, { error: "not found" });
    }
  }
}

export function buildRouter({ ew, secret, logger = null, webDir = null }: { ew: any; secret: string | null; logger?: any; webDir?: string | null } = {} as any) {
  const r = new Router();

  r.get(/^\/health$/, async ({ res }) => {
    // v3.0.2: /health now exposes everything the web UI needs
    // to render a one-shot status banner without a second
    // round-trip: server version, profile, P2P state, model
    // catalog, and the counts of journal/expense rows already
    // on disk. The page calls this every 15 s, so keep it
    // cheap (no RAG lookup; profile loaded on the same path
    // /profile uses so cached reads stay cached).
    const p2pEnabled = !!(ew.cfg?.p2p?.enabled);
    const p2p = p2pEnabled
      ? {
          enabled: true,
          host: ew.cfg.p2p.host,
          port: ew.cfg.p2p.port,
          // The actual peer reachability is best-effort and
          // could block; we leave it to the client to probe
          // `${host}:${port}/health` if it wants a live
          // "peer / local / fallback" badge. The server-side
          // hint here just tells the UI which mode it is in.
        }
      : { enabled: false, host: null, port: null };
    let profileName = null;
    let journalCount = 0;
    let expenseCount = 0;
    try {
      const p = await ew.profile?.load?.();
      if (p && typeof p === "object") profileName = p.name ?? null;
    } catch {
      /* non-fatal — keep /health cheap and idempotent */
    }
    try {
      journalCount = (await ew.journal.readAll()).length;
    } catch {
      /* non-fatal */
    }
    try {
      expenseCount = (await ew.expenses.readAll()).length;
    } catch {
      /* non-fatal */
    }
    send(res, 200, {
      ok: true,
      name: "edgewell-companion",
      version: ew.cfg.version ?? "3.0.0",
      agents: ["health", "finance", "sleep", "nutrition", "hydration", "activity"],
      profile: profileName,
      model: ew.cfg.localModel ?? null,
      delegateModel: ew.cfg.delegateModel ?? null,
      // v3.0.2: tell the UI whether the local vendor stub
      // is in use. The web UI turns this into a "demo
      // mode" banner so the user knows the canned replies
      // are not real LLM output. Defaults to `true` if the
      // LLM is missing or hasn't loaded yet.
      demo: ew.llm?.isDemo?.() ?? true,
      p2p,
      counts: { journal: journalCount, expenses: expenseCount },
    });
  });

  r.get(/^\/profile$/, async ({ req, res }) => {
    const a = authOr401(req, secret);
    if (!a.ok) return send(res, a.status, a.body);
    const p = await ew.profile.load();
    send(res, 200, { profile: p });
  });

  addGetWithHead(r, /^\/journal$/, async ({ req, res }) => {
    const a = authOr401(req, secret);
    if (!a.ok) return send(res, a.status, a.body);
    const limit = Number(new URL(req.url, "http://x").searchParams.get("limit") ?? 50);
    const all = await ew.journal.readAll();
    send(res, 200, { entries: all.slice(-limit) });
  });

  r.post(/^\/journal$/, async ({ req, res, body }) => {
    const a = authOr401(req, secret);
    if (!a.ok) return send(res, a.status, a.body);
    if (!body || typeof body.text !== "string") {
      return send(res, 400, { error: "body.text is required" });
    }
    const record = {
      _ts: new Date().toISOString(),
      text: body.text,
      tags: Array.isArray(body.tags) ? body.tags : [],
      mood: body.mood ?? null,
    };
    await ew.journal.append(record);
    if (logger) logger.info("companion.journal.append", { length: record.text.length });
    send(res, 201, { entry: record });
  });

  addGetWithHead(r, /^\/expenses$/, async ({ req, res }) => {
    const a = authOr401(req, secret);
    if (!a.ok) return send(res, a.status, a.body);
    const limit = Number(new URL(req.url, "http://x").searchParams.get("limit") ?? 50);
    const all = await ew.expenses.readAll();
    send(res, 200, { expenses: all.slice(-limit) });
  });

  r.post(/^\/expenses$/, async ({ req, res, body }) => {
    const a = authOr401(req, secret);
    if (!a.ok) return send(res, a.status, a.body);
    if (!body || typeof body.amount !== "number") {
      return send(res, 400, { error: "body.amount must be a number" });
    }
    const record = {
      _ts: new Date().toISOString(),
      amount: body.amount,
      category: body.category ?? "other",
      note: body.note ?? null,
    };
    await ew.expenses.append(record);
    send(res, 201, { expense: record });
  });

  // Authed API routes that match the same shape as the
  // static handler's catch-all pattern. They MUST be
  // registered before `staticHandler` (which uses
  // /^\/(.*)$/) so the router matches them first.
  r.add("HEAD", /^\/chat\/stream$/, async ({ req, res }) => {
    const a = authOr401(req, secret);
    return send(res, a.ok ? 405 : a.status, a.ok ? { error: "method not allowed" } : a.body);
  });
  r.add("GET", /^\/chat\/stream$/, async ({ req, res }) => {
    const a = authOr401(req, secret);
    return send(res, a.ok ? 405 : a.status, a.ok ? { error: "use POST for streaming" } : a.body);
  });
  r.post(/^\/chat$/, async ({ req, res, body }) => {
    const a = authOr401(req, secret);
    if (!a.ok) return send(res, a.status, a.body);
    if (!body || typeof body.message !== "string") {
      return send(res, 400, { error: "body.message is required" });
    }
    try {
      const result = await ew.orchestrator.handle(body.message);
      send(res, 200, { reply: result });
    } catch (err) {
      send(res, 500, { error: "orchestrator", detail: err.message });
    }
  });

  // Streaming variant of /chat. Returns Server-Sent Events so the
  // web UI can render the router chip, the RAG source citations,
  // and the token-by-token reply as they arrive. v3.0.1 addition
  // that lets `edgewell companion` demo the multi-agent pipeline
  // visibly (e.g. the [health] chip flipping to [finance] mid-
  // response) instead of waiting for the full completion.
  // v3.0.2: HEAD/GET probes on this path return 401 if auth
  // is enabled (see the routes above) so curl -I /chat/stream
  // can't enumerate the endpoint.
  r.post(/^\/chat\/stream$/, async ({ req, res, body }) => {
    const a = authOr401(req, secret);
    if (!a.ok) return send(res, a.status, a.body);
    if (!body || typeof body.message !== "string") {
      return send(res, 400, { error: "body.message is required" });
    }
    sseStart(res);
    // v3.0.2: stop the LLM the moment the client disconnects.
    // Without this, a user who navigates away mid-stream
    // would have the orchestrator keep yielding tokens into
    // a closed socket until the model finished, wasting CPU
    // and (in a real deployment) billable inference. We close
    // over an `aborted` flag that the streamHandle consults
    // between yields; current orchestrator doesn't read it,
    // so we also short-circuit at the loop level below.
    let aborted = false;
    // The companion router tests pass a stripped-down mock
    // req that doesn't implement EventEmitter, so guard the
    // listener attach.
    if (typeof req.on === "function") {
      req.on("close", () => {
        aborted = true;
      });
    }
    try {
      for await (const ev of ew.orchestrator.streamHandle(body.message, [])) {
        if (aborted) break;
        if (!sseEvent(res, ev, ev.type)) break; // sseEvent no-ops once the socket is gone
      }
    } catch (err) {
      if (!aborted) sseEvent(res, { type: "error", message: (err as Error).message }, "error");
    } finally {
      sseEnd(res);
    }
  });

  // Static-file fallback: serve the bundled web UI from webDir.
  // MUST come last so the authed API routes above take
  // precedence. The pattern is a catch-all, so any path that
  // hasn't matched an earlier route lands here. Path-traversal
  // guard rejects any segment that contains ".." so a request
  // for /../etc/passwd cannot escape webDir.
  if (webDir) {
    // Register the static handler for both GET (the browser
    // loads the page) and HEAD (the browser's link-prefetch,
    // curl -I, and the PWA install prompt all probe with
    // HEAD first).
    r.add("GET", /^\/(.*)$/, async (ctx) => staticHandler(ctx, webDir));
    r.add("HEAD", /^\/(.*)$/, async (ctx) => staticHandler(ctx, webDir));
  }

  return r;
}

export function startCompanion({ ew, secret = null, port = 8787, host = "127.0.0.1", logger = null, webDir = null }: { ew?: any; secret?: string | null; port?: number; host?: string; logger?: any; webDir?: string | null } = {}) {
  const router = buildRouter({ ew, secret, logger, webDir });
  const server = http.createServer((req, res) => router.handle(req, res));
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => resolve({ server, port, host }));
  });
}

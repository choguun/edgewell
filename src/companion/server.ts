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
import { Router, send } from "./router.js";
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
  ".svg": "image/svg+xml",
  ".png": "image/png",
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

export function buildRouter({ ew, secret, logger = null, webDir = null }: { ew: any; secret: string | null; logger?: any; webDir?: string | null } = {} as any) {
  const r = new Router();

  r.get(/^\/health$/, async ({ res }) => {
    send(res, 200, {
      ok: true,
      name: "edgewell-companion",
      version: ew.cfg.version ?? "3.0.0",
      agents: ["health", "finance", "sleep", "nutrition", "hydration", "activity"],
    });
  });

  r.get(/^\/profile$/, async ({ req, res }) => {
    const a = authOr401(req, secret);
    if (!a.ok) return send(res, a.status, a.body);
    const p = await ew.profile.load();
    send(res, 200, { profile: p });
  });

  r.get(/^\/journal$/, async ({ req, res }) => {
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

  r.get(/^\/expenses$/, async ({ req, res }) => {
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

  // Static-file fallback: serve the bundled web UI from webDir.
  // Must come AFTER the authed routes so /chat, /journal, etc.
  // still take precedence. Path-traversal guard rejects any
  // segment that contains ".." so a request for /../etc/passwd
  // cannot escape webDir.
  if (webDir) {
    r.get(/^\/(.*)$/, async ({ req, res, params }) => {
      const rel = (params && params[0]) || "index.html";
      if (rel.split("/").some((s) => s === "..")) {
        return send(res, 400, { error: "bad path" });
      }
      const filePath = path.join(webDir, rel);
      try {
        const data = await fs.readFile(filePath);
        const mime = STATIC_MIME[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
        res.writeHead(200, { "content-type": mime });
        res.end(data);
      } catch {
        // SPA fallback: serve index.html for unknown paths.
        try {
          const html = await fs.readFile(path.join(webDir, "index.html"));
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
          res.end(html);
        } catch {
          send(res, 404, { error: "not found" });
        }
      }
    });
  }

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

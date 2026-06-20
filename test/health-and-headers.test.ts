// @ts-nocheck
// Tests for the v3.0.2 companion-server polish:
//   - /health now exposes P2P state, profile, model, counts
//   - Static handler emits Cache-Control headers on GET + HEAD
//   - sseEvent returns false when the socket is already closed
//   - /chat/stream survives a missing .on() on the request
//     (the test suite's mock req strips EventEmitter methods)

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRouter } from "../src/companion/server.js";
import { sseEvent } from "../src/companion/router.js";

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    chunks: [],
    body: undefined,
    writableEnded: false,
    setHeader(k, v) {
      this.headers[k.toLowerCase()] = v;
    },
    // The static handler uses res.writeHead(200, headers) to
    // set the status and headers in one call. The router's
    // send() uses res.statusCode + res.setHeader. Both must
    // work; if a test forgets writeHead, the status silently
    // stays at 200 — keep that behavior.
    writeHead(status, headers = {}) {
      this.statusCode = status;
      for (const [k, v] of Object.entries(headers)) {
        this.headers[k.toLowerCase()] = v;
      }
    },
    write(chunk) {
      this.chunks.push(String(chunk));
      return true;
    },
    end(chunk) {
      if (chunk !== undefined) {
        this.chunks.push(String(chunk));
        // The router calls res.end(JSON.stringify(body)) for
        // JSON responses, so the LAST chunk is the body. Tests
        // that assert on JSON parse it from `res.body`.
        this.body = String(chunk);
      }
      this.writableEnded = true;
    },
    flushHeaders() {
      /* no-op */
    },
  };
}

function mockReq({ method = "GET", url = "/", headers = {}, body = null, noOn = false } = {}) {
  async function* chunks() {
    if (body == null) return;
    yield typeof body === "string" ? body : JSON.stringify(body);
  }
  const req = { method, url, headers, [Symbol.asyncIterator]: chunks };
  if (!noOn) req.on = () => {}; // noop EventEmitter
  return req;
}

const baseEw = {
  cfg: {
    version: "3.0.2",
    localModel: "LLAMA_3_1_8B_INST_Q4_K_M",
    delegateModel: "MEDPSY_4B_INST_Q4_K_M",
    p2p: { enabled: true, host: "127.0.0.1", port: 8788 },
  },
  profile: { name: "ada", load: async () => ({ name: "ada" }) },
  journal: { readAll: async () => [{ _ts: "x", text: "a" }, { _ts: "y", text: "b" }], append: async () => {} },
  expenses: { readAll: async () => [{ _ts: "x", amount: 1 }], append: async () => {} },
  orchestrator: { handle: async () => "ok", streamHandle: async function* () { yield { type: "done" }; } },
};

/* ---------------------------- /health shape ---------------------------- */

test("/health exposes version, profile, model, P2P state, and counts", async () => {
  const r = buildRouter({ ew: baseEw, secret: null });
  const res = mockRes();
  await r.handle(mockReq({ url: "/health" }), res);
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.equal(body.ok, true);
  assert.equal(body.version, "3.0.2");
  assert.equal(body.profile, "ada");
  assert.equal(body.model, "LLAMA_3_1_8B_INST_Q4_K_M");
  assert.equal(body.p2p.enabled, true);
  assert.equal(body.p2p.host, "127.0.0.1");
  assert.equal(body.counts.journal, 2);
  assert.equal(body.counts.expenses, 1);
});

test("/health reports P2P as disabled when the config says so", async () => {
  const ew = { ...baseEw, cfg: { ...baseEw.cfg, p2p: { enabled: false } } };
  const r = buildRouter({ ew, secret: null });
  const res = mockRes();
  await r.handle(mockReq({ url: "/health" }), res);
  const body = JSON.parse(res.body);
  assert.equal(body.p2p.enabled, false);
  assert.equal(body.p2p.host, null);
});

test("/health degrades gracefully when journal/expense stores throw", async () => {
  const ew = {
    ...baseEw,
    journal: { readAll: async () => { throw new Error("disk full"); } },
    expenses: { readAll: async () => { throw new Error("disk full"); } },
  };
  const r = buildRouter({ ew, secret: null });
  const res = mockRes();
  await r.handle(mockReq({ url: "/health" }), res);
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.equal(body.counts.journal, 0);
  assert.equal(body.counts.expenses, 0);
});

/* -------------------------- demo flag (v3.0.2) ------------------------- */

test("/health reports demo=true when the LLM is on the local stub", async () => {
  // EdgeWellLLM.isDemo() returns true when the modelId starts
  // with "stub-model:" (the local vendor stub convention).
  const ew = {
    ...baseEw,
    llm: { isDemo: () => true, modelId: "stub-model:LLAMA_3_1_8B_INST_Q4_K_M" },
  };
  const r = buildRouter({ ew, secret: null });
  const res = mockRes();
  await r.handle(mockReq({ url: "/health" }), res);
  const body = JSON.parse(res.body);
  assert.equal(body.demo, true);
});

test("/health reports demo=false when a real LLM is loaded", async () => {
  const ew = {
    ...baseEw,
    llm: { isDemo: () => false, modelId: "real-model-xyz" },
  };
  const r = buildRouter({ ew, secret: null });
  const res = mockRes();
  await r.handle(mockReq({ url: "/health" }), res);
  const body = JSON.parse(res.body);
  assert.equal(body.demo, false);
});

test("/health defaults demo to true when ew.llm is missing", async () => {
  // Defensive: if the orchestrator is wired without an LLM
  // (test stubs, custom deploys), the UI still gets a sane
  // "demo mode" hint rather than undefined.
  const ew = { ...baseEw, llm: undefined };
  const r = buildRouter({ ew, secret: null });
  const res = mockRes();
  await r.handle(mockReq({ url: "/health" }), res);
  const body = JSON.parse(res.body);
  assert.equal(body.demo, true);
});

/* ------------------------- Cache-Control on shell ---------------------- */

test("static handler sends Cache-Control on a successful GET", async () => {
  // We need a real webDir; use the project's own web/ folder
  // (the test suite is the one place we read from the source
  // tree directly).
  const path = await import("node:path");
  const webDir = path.resolve(process.cwd(), "web");
  const r = buildRouter({ ew: baseEw, secret: null, webDir });
  const res = mockRes();
  await r.handle(mockReq({ url: "/index.html" }), res);
  assert.equal(res.statusCode, 200);
  assert.match(res.headers["cache-control"], /max-age=/);
});

test("static handler sends Cache-Control on HEAD too", async () => {
  const path = await import("node:path");
  const webDir = path.resolve(process.cwd(), "web");
  const r = buildRouter({ ew: baseEw, secret: null, webDir });
  const res = mockRes();
  await r.handle(mockReq({ method: "HEAD", url: "/manifest.webmanifest" }), res);
  assert.equal(res.statusCode, 200);
  assert.match(res.headers["content-type"], /application\/manifest\+json/);
  assert.match(res.headers["cache-control"], /max-age=/);
});

/* --------------------------- sseEvent return --------------------------- */

test("sseEvent returns false when the response is already ended", () => {
  const res = mockRes();
  res.writableEnded = true;
  assert.equal(sseEvent(res, { hello: "world" }, "test"), false);
});

test("sseEvent returns true on a normal write", () => {
  const res = mockRes();
  assert.equal(sseEvent(res, { hello: "world" }, "test"), true);
  assert.equal(res.chunks.length, 1);
  assert.match(res.chunks[0], /^event: test\n/);
});

/* -------------------- /chat/stream with mock req (no on) --------------- */

test("/chat/stream tolerates a mock req that has no .on()", async () => {
  const r = buildRouter({ ew: baseEw, secret: null });
  const res = mockRes();
  await r.handle(
    mockReq({
      method: "POST",
      url: "/chat/stream",
      body: { message: "hi" },
      noOn: true,
    }),
    res,
  );
  // Should not 500; the handler should accept the stream and
  // emit at least the `done` frame from the fake orchestrator.
  assert.equal(res.statusCode, 200);
  assert.match(res.headers["content-type"], /text\/event-stream/);
  const body = res.chunks.join("");
  assert.match(body, /^event: done\b/m);
});

/* ------------------- HEAD on authed API routes (v3.0.2) ---------------- */

test("HEAD on /journal requires auth when secret is set", async () => {
  const { newSecret: ns } = await import("../src/companion/auth.js");
  const s = ns();
  const r = buildRouter({ ew: baseEw, secret: s });
  const res = mockRes();
  await r.handle(mockReq({ method: "HEAD", url: "/journal" }), res);
  assert.equal(res.statusCode, 401);
});

test("HEAD on /expenses requires auth when secret is set", async () => {
  const { newSecret: ns } = await import("../src/companion/auth.js");
  const s = ns();
  const r = buildRouter({ ew: baseEw, secret: s });
  const res = mockRes();
  await r.handle(mockReq({ method: "HEAD", url: "/expenses" }), res);
  assert.equal(res.statusCode, 401);
});

test("HEAD on /journal accepts a valid bearer token (200 + no body)", async () => {
  const { newSecret: ns, signToken: st } = await import("../src/companion/auth.js");
  const s = ns();
  const t = st({ secret: s, subject: "test" });
  const r = buildRouter({ ew: baseEw, secret: s });
  const res = mockRes();
  await r.handle(
    mockReq({ method: "HEAD", url: "/journal", headers: { authorization: `Bearer ${t}` } }),
    res,
  );
  assert.equal(res.statusCode, 200);
  // HEAD responses should not include a body; the body
  // returned by send() must be discarded.
  assert.equal(res.body, undefined);
});

/* ------------------- /chat/stream method enforcement ------------------ */

test("/chat/stream GET requires auth (no token → 401)", async () => {
  const { newSecret: ns } = await import("../src/companion/auth.js");
  const s = ns();
  const r = buildRouter({ ew: baseEw, secret: s });
  const res = mockRes();
  await r.handle(mockReq({ method: "GET", url: "/chat/stream" }), res);
  assert.equal(res.statusCode, 401);
});

test("/chat/stream HEAD requires auth (no token → 401)", async () => {
  const { newSecret: ns } = await import("../src/companion/auth.js");
  const s = ns();
  const r = buildRouter({ ew: baseEw, secret: s });
  const res = mockRes();
  await r.handle(mockReq({ method: "HEAD", url: "/chat/stream" }), res);
  assert.equal(res.statusCode, 401);
});

test("/chat/stream GET with a valid token returns 405 (POST only)", async () => {
  const { newSecret: ns, signToken: st } = await import("../src/companion/auth.js");
  const s = ns();
  const t = st({ secret: s, subject: "test" });
  const r = buildRouter({ ew: baseEw, secret: s });
  const res = mockRes();
  await r.handle(
    mockReq({ method: "GET", url: "/chat/stream", headers: { authorization: `Bearer ${t}` } }),
    res,
  );
  assert.equal(res.statusCode, 405);
});

/* ------------------- Static handler is LAST in the chain ---------------- */

test("static handler does not match /chat/stream when secret is set", async () => {
  // Regression guard: if /chat/stream routes are registered
  // after the static catch-all, the static handler would
  // answer the request with the SPA shell, leaking the
  // endpoint and bypassing auth.
  const { newSecret: ns } = await import("../src/companion/auth.js");
  const s = ns();
  const path = await import("node:path");
  const webDir = path.resolve(process.cwd(), "web");
  const r = buildRouter({ ew: baseEw, secret: s, webDir });
  const res = mockRes();
  await r.handle(mockReq({ method: "GET", url: "/chat/stream" }), res);
  // Should be 401 (the /chat/stream GET handler enforces
  // auth), not 200 (which would mean the static handler
  // served the SPA shell).
  assert.equal(res.statusCode, 401);
});

/* ------------------------- --no-auth flag (v3.0.2) --------------------- */

test("resolveAuthFlag: default (no flag) keeps auth on", async () => {
  const { resolveAuthFlag } = await import("../src/commands/companion.js");
  assert.equal(resolveAuthFlag({}), true);
  assert.equal(resolveAuthFlag({ auth: true }), true);
  assert.equal(resolveAuthFlag({ auth: "true" }), true);
});

test("resolveAuthFlag: --auth=false disables auth", async () => {
  const { resolveAuthFlag } = await import("../src/commands/companion.js");
  assert.equal(resolveAuthFlag({ auth: false }), false);
  assert.equal(resolveAuthFlag({ auth: "false" }), false);
});

test("resolveAuthFlag: --no-auth disables auth (regression)", async () => {
  // v3.0.2 regression guard: the previous version only
  // checked `flags.auth` and silently ignored `--no-auth`,
  // so the user thought auth was off but the server
  // returned 401 on every API call.
  const { resolveAuthFlag } = await import("../src/commands/companion.js");
  assert.equal(resolveAuthFlag({ "no-auth": true }), false);
  assert.equal(resolveAuthFlag({ "no-auth": "true" }), false);
});

test("resolveAuthFlag: explicit --no-auth wins over --auth=true", async () => {
  // If the user passes both, --no-auth should win. This
  // matches the "later / more specific flag wins" intuition
  // and lets `--no-auth` act as a hard override.
  const { resolveAuthFlag } = await import("../src/commands/companion.js");
  assert.equal(
    resolveAuthFlag({ "no-auth": true, auth: true }),
    false,
  );
});

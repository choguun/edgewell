// @ts-nocheck
// Regression test for CRIT-2 / UAT-FN-14: companion router must
// send Access-Control-Allow-* headers and short-circuit OPTIONS
// preflight with 204, otherwise cross-origin browser clients
// (the bundled web/ UI, a phone browser, a static file server
// pointing at the companion) fail every request.

import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { Router, send } from "../src/companion/router.js";
import { buildRouter } from "../src/companion/server.js";

function startServer(router: Router): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => router.handle(req, res));
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") return reject(new Error("no addr"));
      resolve({
        url: `http://127.0.0.1:${addr.port}`,
        close: () => new Promise<void>((r) => server.close(() => r())),
      });
    });
  });
}

async function fetchOnce(url: string, init: RequestInit = {}): Promise<{ status: number; headers: Headers; text: string }> {
  const res = await fetch(url, init);
  const text = await res.text();
  return { status: res.status, headers: res.headers, text };
}

test("send() helper includes Access-Control-Allow-Origin", async () => {
  const r = new Router();
  let captured: Record<string, string> = {};
  r.get(/^\/echo-headers$/, async ({ res }) => {
    const srv = http.createServer((_req, res2) => {
      // Use a fake res to capture the headers send() writes.
      captured = res2.getHeaders() as Record<string, string>;
      res2.end();
    });
    // We can't easily intercept res.getHeaders() here; instead
    // assert via the live server below.
    srv.close();
    send(res, 200, { ok: true });
  });
  const { url, close } = await startServer(r);
  try {
    const { headers } = await fetchOnce(`${url}/echo-headers`);
    assert.equal(headers.get("access-control-allow-origin"), "*", "CORS origin should be *");
    assert.equal(headers.get("access-control-allow-methods"), "GET, POST, OPTIONS");
  } finally {
    await close();
  }
});

test("OPTIONS preflight returns 204 with CORS headers", async () => {
  const r = new Router();
  r.get(/^\/chat$/, async ({ res }) => send(res, 200, { ok: true }));
  const { url, close } = await startServer(r);
  try {
    const { status, headers } = await fetchOnce(`${url}/chat`, { method: "OPTIONS" });
    assert.equal(status, 204, `OPTIONS should return 204, got ${status}`);
    assert.equal(headers.get("access-control-allow-origin"), "*");
    assert.match(headers.get("access-control-allow-headers") ?? "", /authorization/i);
  } finally {
    await close();
  }
});

test("buildRouter wires /health, /chat, /journal, /expenses, /profile (CRIT-3)", async () => {
  const ew = {
    cfg: { version: "3.0.0" },
    profile: { load: async () => ({ name: "test" }) },
    journal: { readAll: async () => [], append: async () => {} },
    expenses: { readAll: async () => [], append: async () => {} },
    orchestrator: { handle: async () => "stub reply" },
  };
  const router = buildRouter({ ew: ew as any, secret: null, logger: null });
  const { url, close } = await startServer(router);
  try {
    // /health is unauthenticated and should return 200.
    const h = await fetchOnce(`${url}/health`);
    assert.equal(h.status, 200);
    const body = JSON.parse(h.text);
    assert.equal(body.ok, true);
    assert.equal(body.name, "edgewell-companion");

    // /chat is unauthenticated when secret=null; should return 200
    // (the orchestrator.handle stub returns "stub reply").
    const c = await fetchOnce(`${url}/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "hi" }),
    });
    assert.equal(c.status, 200, `POST /chat should return 200, got ${c.status} body=${c.text}`);

    // /journal GET should return 200.
    const j = await fetchOnce(`${url}/journal`);
    assert.equal(j.status, 200);
    assert.deepEqual(JSON.parse(j.text), { entries: [] });

    // /journal?limit=20 (the URL the bundled web UI calls) should
    // also work — the router uses /^\/journal$/ which matches the
    // path-without-query form.
    const j20 = await fetchOnce(`${url}/journal?limit=20`);
    assert.equal(j20.status, 200);
  } finally {
    await close();
  }
});

test("authed routes return 401 when secret is set and no bearer token is provided", async () => {
  const ew = {
    cfg: { version: "3.0.0" },
    profile: { load: async () => ({ name: "test" }) },
    journal: { readAll: async () => [] },
  };
  const router = buildRouter({ ew: ew as any, secret: "test-secret", logger: null });
  const { url, close } = await startServer(router);
  try {
    const r = await fetchOnce(`${url}/profile`);
    assert.equal(r.status, 401, "missing bearer token should return 401");
  } finally {
    await close();
  }
});
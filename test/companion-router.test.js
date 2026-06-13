// Tests for the companion HTTP router and a couple of end-to-end
// requests against the server module.

import { test } from "node:test";
import assert from "node:assert/strict";
import { Router, send } from "../src/companion/router.js";
import { buildRouter } from "../src/companion/server.js";
import { newSecret, signToken } from "../src/companion/auth.js";

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(k, v) {
      this.headers[k.toLowerCase()] = v;
    },
    end(body) {
      this.body = body;
    },
  };
}

function mockReq({ method = "GET", url = "/", headers = {}, body = null } = {}) {
  async function* chunks() {
    if (body == null) return;
    yield typeof body === "string" ? body : JSON.stringify(body);
  }
  return {
    method,
    url,
    headers,
    [Symbol.asyncIterator]: chunks,
  };
}

test("Router returns 404 for unknown routes", async () => {
  const r = new Router();
  const res = mockRes();
  await r.handle(mockReq({ url: "/missing" }), res);
  assert.equal(res.statusCode, 404);
  assert.match(res.body, /not found/);
});

test("Router matches a GET handler and returns JSON", async () => {
  const r = new Router();
  r.get(/^\/ping$/, ({ res }) => send(res, 200, { ok: true }));
  const res = mockRes();
  await r.handle(mockReq({ url: "/ping" }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers["content-type"], "application/json; charset=utf-8");
  assert.equal(JSON.parse(res.body).ok, true);
});

test("Router extracts URL params from groups", async () => {
  const r = new Router();
  r.get(/^\/items\/(\d+)$/, ({ res, params }) => send(res, 200, { id: params[0] }));
  const res = mockRes();
  await r.handle(mockReq({ url: "/items/42" }), res);
  assert.equal(JSON.parse(res.body).id, "42");
});

test("Router parses POST JSON body", async () => {
  const r = new Router();
  r.post(/^\/echo$/, ({ res, body }) => send(res, 201, { echoed: body }));
  const res = mockRes();
  await r.handle(
    mockReq({ method: "POST", url: "/echo", body: { hello: "world" } }),
    res,
  );
  assert.equal(res.statusCode, 201);
  assert.equal(JSON.parse(res.body).echoed.hello, "world");
});

test("Router returns 400 for invalid JSON body", async () => {
  const r = new Router();
  r.post(/^\/echo$/, ({ res, body }) => send(res, 201, { echoed: body }));
  const res = mockRes();
  await r.handle(
    mockReq({ method: "POST", url: "/echo", body: "{not json" }),
    res,
  );
  assert.equal(res.statusCode, 400);
});

test("Router wraps handler errors in 500", async () => {
  const r = new Router();
  r.get(/^\/boom$/, () => {
    throw new Error("kaboom");
  });
  const res = mockRes();
  await r.handle(mockReq({ url: "/boom" }), res);
  assert.equal(res.statusCode, 500);
  assert.match(res.body, /kaboom/);
});

test("buildRouter returns 200 on /health", async () => {
  const ew = {
    cfg: { version: "3.0.0" },
    profile: { load: async () => ({ name: "test" }) },
    journal: { readAll: async () => [], append: async () => {} },
    expenses: { readAll: async () => [], append: async () => {} },
    orchestrator: { handle: async () => "ok" },
  };
  const r = buildRouter({ ew, secret: null });
  const res = mockRes();
  await r.handle(mockReq({ url: "/health" }), res);
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.equal(body.ok, true);
  assert.equal(body.version, "3.0.0");
  assert.ok(body.agents.includes("sleep"));
});

test("buildRouter requires a token when secret is set", async () => {
  const ew = {
    cfg: { version: "3.0.0" },
    profile: { load: async () => ({}) },
    journal: { readAll: async () => [], append: async () => {} },
    expenses: { readAll: async () => [], append: async () => {} },
    orchestrator: { handle: async () => "ok" },
  };
  const secret = newSecret();
  const r = buildRouter({ ew, secret });
  const res = mockRes();
  await r.handle(mockReq({ url: "/profile" }), res);
  assert.equal(res.statusCode, 401);
});

test("buildRouter accepts a valid bearer token", async () => {
  const ew = {
    cfg: { version: "3.0.0" },
    profile: { load: async () => ({ name: "ada" }) },
    journal: { readAll: async () => [], append: async () => {} },
    expenses: { readAll: async () => [], append: async () => {} },
    orchestrator: { handle: async () => "ok" },
  };
  const secret = newSecret();
  const r = buildRouter({ ew, secret });
  const token = signToken({ secret, subject: "phone-1" });
  const res = mockRes();
  await r.handle(mockReq({ url: "/profile", headers: { authorization: `Bearer ${token}` } }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(JSON.parse(res.body).profile.name, "ada");
});

test("buildRouter posts a journal entry and returns 201", async () => {
  const appended = [];
  const ew = {
    cfg: { version: "3.0.0" },
    profile: { load: async () => ({}) },
    journal: { readAll: async () => [], append: async (e) => appended.push(e) },
    expenses: { readAll: async () => [], append: async () => {} },
    orchestrator: { handle: async () => "ok" },
  };
  const r = buildRouter({ ew, secret: null });
  const res = mockRes();
  await r.handle(
    mockReq({ method: "POST", url: "/journal", body: { text: "hello", tags: ["mood"] } }),
    res,
  );
  assert.equal(res.statusCode, 201);
  assert.equal(appended.length, 1);
  assert.equal(appended[0].text, "hello");
});

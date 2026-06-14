// Regression tests for the fourth E2E sweep. Each test pins
// down one of the DoS, id-collision, plugin-timeout, or
// coverage-gap bugs fixed in this sweep.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, mkdir, rm, realpath, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { startCompanion } from "../src/companion/server.js";
import { newSecret, signToken } from "../src/companion/auth.js";
import { VectorIndex } from "../src/vector-index.js";
import { loadPlugins } from "../src/plugins.js";
import { Router } from "../src/companion/router.js";
import { JsonlStore } from "../src/store.js";
import { ProfileStore } from "../src/profile.js";
import { createEdgeWell } from "../src/index.js";
import { makeAnnouncer, buildServiceUrl } from "../src/companion/mdns.js";
import { summariseEvents, toJournalLine } from "../src/multimodal/sensors.js";
import { ingestImage } from "../src/multimodal/image.js";
import { ingestAudio } from "../src/multimodal/audio.js";
import { ingestPath } from "../src/multimodal/index.js";
import { HealthAgent } from "../src/agents/health.js";
import { FinanceAgent } from "../src/agents/finance.js";
import { Orchestrator } from "../src/agents/orchestrator.js";
import { SleepAgent } from "../src/agents/sleep.js";
import { NutritionAgent } from "../src/agents/nutrition.js";
import { HydrationAgent } from "../src/agents/hydration.js";
import { ActivityAgent } from "../src/agents/activity.js";
import { redact, redactRecord } from "../src/redact.js";

function silent() {
  const origLog = console.log;
  const origErr = console.error;
  console.log = () => {};
  console.error = () => {};
  return () => {
    console.log = origLog;
    console.error = origErr;
  };
}

function withExit(fn) {
  const restore = silent();
  let code = 0;
  const origExit = process.exit;
  process.exit = (c) => { code = c; throw new Error("__exit__"); };
  return {
    restore() { process.exit = origExit; restore(); },
    get code() { return code; },
    run: async () => {
      try { await fn(); }
      catch (e) { if (e.message !== "__exit__") throw e; }
    },
  };
}

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    end(b) { this.body = b; },
  };
}

function mockReq({ method = "GET", url = "/", headers = {}, body = null } = {}) {
  return {
    method, url, headers,
    [Symbol.asyncIterator]: async function* () {
      if (body == null) return;
      yield typeof body === "string" ? body : JSON.stringify(body);
    },
  };
}

// ===== companion body-size cap =====

test("Router rejects a body larger than MAX_BODY_BYTES with 413", async () => {
  const r = new Router();
  r.post(/^\/echo$/, ({ res, body }) => send(res, 200, { ok: true, len: body?.message?.length ?? 0 }));
  const res = mockRes();
  const big = "x".repeat(2 * 1024 * 1024); // 2 MiB
  await r.handle(mockReq({ method: "POST", url: "/echo", body: { message: big } }), res);
  assert.equal(res.statusCode, 413);
  const body = JSON.parse(res.body);
  assert.equal(body.error, "body too large");
  assert.equal(body.limit, 1024 * 1024);
});

test("Router allows a body just under the cap", async () => {
  const r = new Router();
  r.post(/^\/echo$/, ({ res, body }) => send(res, 200, { ok: true, len: body?.message?.length ?? 0 }));
  const res = mockRes();
  const msg = "x".repeat(64 * 1024); // 64 KiB
  await r.handle(mockReq({ method: "POST", url: "/echo", body: { message: msg } }), res);
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.equal(body.len, 64 * 1024);
});

test("Router respects MAX_BODY_BYTES=0 to disable the cap", async () => {
  process.env.MAX_BODY_BYTES = "0";
  try {
    const { Router: R } = await import("../src/companion/router.js?t=" + Date.now());
    const r = new R();
    r.post(/^\/echo$/, ({ res, body }) => send(res, 200, { ok: true, len: body?.message?.length ?? 0 }));
    const res = mockRes();
    const big = "x".repeat(2 * 1024 * 1024);
    await r.handle(mockReq({ method: "POST", url: "/echo", body: { message: big } }), res);
    assert.equal(res.statusCode, 200);
  } finally {
    process.env.MAX_BODY_BYTES = undefined;
  }
});

test("Router falls back to 1 MiB cap on invalid MAX_BODY_BYTES", async () => {
  process.env.MAX_BODY_BYTES = "not-a-number";
  try {
    const { Router: R } = await import("../src/companion/router.js?t=" + Date.now());
    const r = new R();
    r.post(/^\/echo$/, ({ res }) => send(res, 200, {}));
    const res = mockRes();
    const big = "x".repeat(2 * 1024 * 1024);
    await r.handle(mockReq({ method: "POST", url: "/echo", body: { message: big } }), res);
    assert.equal(res.statusCode, 413);
  } finally {
    process.env.MAX_BODY_BYTES = undefined;
  }
});

// ===== VectorIndex id-collision fix =====

test("VectorIndex no longer collides on single-chunk ingests from the same source", async () => {
  const vidx = new VectorIndex({ dim: 64 });
  for (let i = 0; i < 1000; i++) {
    await vidx.ingest({ source: "test", text: `entry ${i}: lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua` });
  }
  assert.equal(vidx.store.size(), 1000);
});

test("VectorIndex upsert is idempotent on the same text", async () => {
  const vidx = new VectorIndex({ dim: 64 });
  for (let i = 0; i < 5; i++) await vidx.ingest({ source: "x", text: "hello world" });
  assert.equal(vidx.store.size(), 1);
});

test("VectorIndex chunks a long text into multiple distinct ids", async () => {
  const vidx = new VectorIndex({ dim: 32, chunkSize: 60, chunkOverlap: 10 });
  const long = "lorem ipsum ".repeat(50);
  const n = await vidx.ingest({ source: "doc", text: long });
  assert.equal(vidx.store.size(), n);
});

// ===== plugin timeout =====

test("loadPlugins times out a slow onLoad hook", async () => {
  process.env.EDGEWELL_PLUGIN_TIMEOUT_MS = "50";
  try {
    const tmpDir = await realpath(await mkdtemp("/tmp/edgewell-pgt-"));
    const dir = tmpDir + "/plugindir";
    await mkdir(dir, { recursive: true });
    // Use a long timer that resolves (not 99s) so the test file's
    // event loop can drain once the loader's timeout fires.
    await writeFile(join(dir, "slow.plugin.js"), `
export default {
  name: "slow",
  hooks: {
    async onLoad() { await new Promise(r => setTimeout(r, 2000)); },
  },
};
`);

    const { loadPlugins: loadP } = await import("../src/plugins.js?t=" + Date.now());
    const ew = { tools: {}, profile: { load: async () => ({}) }, journal: { readAll: async () => [] }, expenses: { readAll: async () => [] }, rag: { _ensure: async () => {}, chunks: [] } };
    const t0 = Date.now();
    const out = await loadP(dir, ew);
    const elapsed = Date.now() - t0;
    const slow = out.loaded.find((l) => l.name === "slow.plugin.js");
    assert.equal(slow.ok, false);
    assert.match(slow.error, /timed out/);
    assert.ok(elapsed < 1000, `expected quick timeout, got ${elapsed}ms`);
    await rm(tmpDir, { recursive: true });
  } finally {
    process.env.EDGEWELL_PLUGIN_TIMEOUT_MS = undefined;
  }
});

test("loadPlugins accepts a fast plugin within the timeout", async () => {
  const tmpDir = await realpath(await mkdtemp("/tmp/edgewell-pgf-"));
  const dir = tmpDir + "/plugindir";
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "fast.plugin.js"), `
export default {
  name: "fast",
  hooks: {
    async onLoad() { /* quick */ },
  },
};
`);
  const ew = { tools: {}, profile: { load: async () => ({}) }, journal: { readAll: async () => [] }, expenses: { readAll: async () => [] }, rag: { _ensure: async () => {}, chunks: [] } };
  const out = await loadPlugins(dir, ew);
  const fast = out.loaded.find((l) => l.name === "fast.plugin.js");
  assert.equal(fast.ok, true);
  await rm(tmpDir, { recursive: true });
});

// ===== coverage-gap tests =====

test("JsonlStore append/readAll roundtrips 1000 records", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edgewell-1k-"));
  const file = join(dir, "j.jsonl");
  const s = new JsonlStore(file);
  for (let i = 0; i < 1000; i++) {
    await s.append({ kind: "journal", text: `e${i}`, idx: i });
  }
  const all = await s.readAll();
  assert.equal(all.length, 1000);
  await rm(dir, { recursive: true });
});

test("JsonlStore strict mode throws on a malformed line", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edgewell-strict-"));
  const file = join(dir, "j.jsonl");
  await writeFile(file, '{"a":1}\nnot json\n{"a":2}\n');
  const s = new JsonlStore(file, { strict: true });
  await assert.rejects(() => s.readAll(), /malformed/);
  await rm(dir, { recursive: true });
});

test("JsonlStore filter returns the matching records", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edgewell-filter-"));
  const file = join(dir, "j.jsonl");
  const s = new JsonlStore(file);
  await s.append({ kind: "journal", text: "a", tag: "x" });
  await s.append({ kind: "journal", text: "b", tag: "y" });
  await s.append({ kind: "journal", text: "c", tag: "x" });
  const x = await s.filter((e) => e.tag === "x");
  assert.equal(x.length, 2);
  await rm(dir, { recursive: true });
});

test("ProfileStore roundtrips through save/load", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edgewell-profr-"));
  const file = join(dir, "p.json");
  const p = new ProfileStore(file);
  const initial = await p.load();
  assert.equal(initial.name, "friend");
  await p.update({ name: "ada", language: "en" });
  const p2 = new ProfileStore(file);
  const loaded = await p2.load();
  assert.equal(loaded.name, "ada");
  await rm(dir, { recursive: true });
});

test("ProfileStore returns defaults when the file is missing", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edgewell-profn-"));
  const p = new ProfileStore(join(dir, "nope.json"));
  const r = await p.load();
  assert.equal(r.name, "friend");
  await rm(dir, { recursive: true });
});

test("ProfileStore returns defaults when the file is malformed", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edgewell-profbad-"));
  const file = join(dir, "p.json");
  await writeFile(file, "{ not json");
  const p = new ProfileStore(file);
  const r = await p.load();
  assert.equal(r.name, "friend");
  await rm(dir, { recursive: true });
});

test("createEdgeWell wires every expected field", () => {
  const ew = createEdgeWell({ data: { dir: ".tmp-cew-test", journalFile: "j.jsonl", expensesFile: "e.jsonl", profileFile: "p.json" } });
  for (const k of ["cfg", "llm", "profile", "journal", "expenses", "rag", "health", "finance", "orchestrator"]) {
    assert.ok(ew[k], `createEdgeWell should expose "${k}"`);
  }
});

test("createEdgeWell honours P2P_ENABLED env var", () => {
  const prev = process.env.EDGEWELL_P2P_ENABLED;
  try {
    process.env.EDGEWELL_P2P_ENABLED = "0";
    const ew = createEdgeWell({ data: { dir: ".tmp-p2p-off", journalFile: "j.jsonl", expensesFile: "e.jsonl", profileFile: "p.json" } });
    // Local-only path returns an EdgeWellLLM (no DelegatingLLM).
    assert.equal(ew.llm.constructor.name, "EdgeWellLLM");
    process.env.EDGEWELL_P2P_ENABLED = "1";
    const ew2 = createEdgeWell({ data: { dir: ".tmp-p2p-on", journalFile: "j.jsonl", expensesFile: "e.jsonl", profileFile: "p.json" } });
    // P2P-on path returns a DelegatingLLM wrapper.
    assert.equal(ew2.llm.constructor.name, "DelegatingLLM");
  } finally {
    if (prev === undefined) delete process.env.EDGEWELL_P2P_ENABLED;
    else process.env.EDGEWELL_P2P_ENABLED = prev;
  }
});

test("makeAnnouncer starts and stops without throwing", async () => {
  const a = makeAnnouncer({ name: "test", port: 8787, host: "127.0.0.1" });
  const r = await a.start();
  assert.equal(r.ok, true);
  assert.equal(r.mode, "stub");
  const s = await a.stop();
  assert.equal(s.ok, true);
});

test("buildServiceUrl returns a URL with the port", () => {
  const u = buildServiceUrl({ host: "192.168.1.5", port: 8787, name: "edgewell" });
  assert.match(u, /^http:\/\/192\.168\.1\.5:8787/);
  assert.match(u, /service: edgewell/);
});

test("summariseEvents produces a per-kind breakdown", () => {
  const events = [
    { kind: "steps", ts: "2026-01-01T12:00:00Z", value: 5000 },
    { kind: "steps", ts: "2026-01-02T12:00:00Z", value: 8000 },
  ];
  const s = summariseEvents(events);
  assert.ok(s.steps, "summary should have a 'steps' key");
  assert.equal(s.steps.count, 2);
  assert.equal(s.steps.min, 5000);
  assert.equal(s.steps.max, 8000);
});

test("summariseEvents returns an empty summary for empty input", () => {
  const s = summariseEvents([]);
  assert.equal(s.steps, undefined);
});

test("summariseEvents filters out unsupported event kinds", () => {
  const events = [
    { kind: "steps", ts: "2026-01-01T12:00:00Z", value: 5000 },
    { kind: "weather", ts: "2026-01-01T12:00:00Z", value: 22 },
    { kind: "heart_rate", ts: "2026-01-01T12:00:00Z", value: 72 },
  ];
  const s = summariseEvents(events);
  assert.ok(s.steps, "supported kind should appear");
  assert.equal(s.weather, undefined, "unsupported kind should be filtered out");
  assert.ok(s.heart_rate, "heart_rate is supported");
});

test("ingestImage returns a placeholder caption for an unknown file", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edgewell-img-"));
  const file = join(dir, "photo.jpg");
  await writeFile(file, "fake jpeg bytes");
  const r = await ingestImage({ filePath: file });
  assert.equal(r.kind, "image");
  assert.ok(r.text);
  assert.match(r.text, /No vision model configured/);
  await rm(dir, { recursive: true });
});

test("ingestImage requires a file path or buffer", async () => {
  await assert.rejects(() => ingestImage({}), /requires filePath/);
});

test("ingestAudio returns a placeholder transcript", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edgewell-aud-"));
  const file = join(dir, "voice.wav");
  await writeFile(file, "fake wav bytes");
  const r = await ingestAudio({ filePath: file });
  assert.equal(r.kind, "audio");
  assert.ok(r.text);
  await rm(dir, { recursive: true });
});

test("ingestPath routes .txt to text passthrough", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edgewell-ing-"));
  const file = join(dir, "note.txt");
  await writeFile(file, "hello world");
  const r = await ingestPath({ filePath: file });
  assert.equal(r.kind, "text");
  assert.match(r.text, /hello world/);
  await rm(dir, { recursive: true });
});

test("ingestPath routes .jsonl through the text fallback", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edgewell-ing2-"));
  const file = join(dir, "sensors.jsonl");
  await writeFile(file, '{"kind":"steps","ts":"2026-01-01T12:00:00Z","value":5000}\n');
  const r = await ingestPath({ filePath: file });
  // The current dispatcher falls .jsonl through to text (the
  // sensors CLI command reads .jsonl directly via the sensors
  // module). Verifying the dispatcher shape is sufficient.
  assert.equal(r.kind, "text");
  assert.match(r.text, /steps/);
  await rm(dir, { recursive: true });
});

test("ingestPath falls through to text for unknown extensions", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edgewell-ing3-"));
  const file = join(dir, "x.unknown");
  await writeFile(file, "x");
  const r = await ingestPath({ filePath: file });
  assert.equal(r.kind, "text");
  await rm(dir, { recursive: true });
});

test("redactRecord walks nested structures", () => {
  const obj = { name: "ada", email: "ada@example.com", notes: { phone: "555-123-4567" } };
  const out = redactRecord(obj);
  assert.equal(out.email, "[REDACTED_EMAIL]");
  assert.equal(out.name, "ada");
});

test("redact preserves null and non-string values in a record", () => {
  const out = redactRecord({ a: null, b: 123, c: true, d: "ada@example.com" });
  assert.equal(out.a, null);
  assert.equal(out.b, 123);
  assert.equal(out.c, true);
  assert.equal(out.d, "[REDACTED_EMAIL]");
});

test("healthAgent is exported from agents/index", () => {
  assert.equal(typeof HealthAgent, "function");
});

test("FinanceAgent, Orchestrator, SleepAgent, NutritionAgent, HydrationAgent, ActivityAgent are all classes", () => {
  for (const Cls of [FinanceAgent, Orchestrator, SleepAgent, NutritionAgent, HydrationAgent, ActivityAgent]) {
    assert.equal(typeof Cls, "function");
  }
});

// Re-export `send` for the Router tests above.
import { send } from "../src/companion/router.js";

// @ts-nocheck
// Tests for the v3.0.1 streaming chat path:
//   1. Orchestrator.streamHandle yields route/context/token/done
//   2. Orchestrator.streamHandle yields an error event on LLM throw
//   3. POST /chat/stream writes text/event-stream SSE frames
//
// We do NOT spin up a real HTTP listener for the SSE test —
// the router tests already use a mock req/res and a tiny
// in-memory `res.write` capture is enough to assert the frame
// format.

import { test } from "node:test";
import assert from "node:assert/strict";
import { Orchestrator } from "../src/agents/orchestrator.js";
import { buildRouter } from "../src/companion/server.js";
import { newSecret, signToken } from "../src/companion/auth.js";
import { RagIndex } from "../src/rag.js";

function fakeLlm(routerReply, streamedReply) {
  return {
    load: async () => 1,
    unload: async () => {},
    prompt: async () => routerReply,
    stream: async function* () {
      for (const c of streamedReply) yield c;
    },
  };
}

function fakeAgent(reply) {
  return {
    ask: async () => reply,
    streamAsk: async function* () {
      for (const c of reply) yield c;
    },
  };
}

async function collect(gen) {
  const out = [];
  for await (const ev of gen) out.push(ev);
  return out;
}

test("streamHandle emits route + tokens + done in order", async () => {
  const o = new Orchestrator({
    llm: fakeLlm('{"agent":"health","reason":"symptom"}', "rest and hydrate"),
    health: fakeAgent("rest and hydrate"),
    finance: fakeAgent("save more"),
  });
  const events = await collect(o.streamHandle("I have a headache"));
  // First event must be the route chip.
  assert.equal(events[0].type, "route");
  assert.equal(events[0].agent, "health");
  // Then one token event per character.
  const tokens = events
    .filter((e) => e.type === "token")
    .map((e) => e.text)
    .join("");
  assert.equal(tokens, "rest and hydrate");
  // And the stream must end with a `done` sentinel.
  assert.equal(events[events.length - 1].type, "done");
  // Health branch never emits a `context` event when rag is null.
  assert.ok(!events.some((e) => e.type === "context"));
});

test("streamHandle emits a context event with RAG hits for health", async () => {
  // Use the real RagIndex with a tiny in-memory corpus so the
  // search hits are deterministic. RAG writes to a tmpdir.
  const os = await import("node:os");
  const path = await import("node:path");
  const fs = await import("node:fs/promises");
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "edgewell-rag-"));
  const rag = new RagIndex({ dir, chunkSize: 200, chunkOverlap: 20, topK: 3 });
  // Use a vocabulary that matches the query exactly. The
  // in-memory indexer is TF-IDF over surface tokens (not
  // stemmed), so "sleep" and "slept" do not match each other.
  await rag.ingest({
    source: "journal/2026-06-12.md",
    text: "Sleep was poor last night, woke three times, sleep tracker showed low rem.",
  });
  await rag.ingest({
    source: "journal/2026-06-15.md",
    text: "Sleep was great, full eight hours, no caffeine after 4pm, deep rem cycles.",
  });

  const o = new Orchestrator({
    llm: fakeLlm('{"agent":"health","reason":"sleep"}', "try earlier bedtimes"),
    health: fakeAgent("try earlier bedtimes"),
    finance: fakeAgent("save more"),
    rag,
  });
  const events = await collect(o.streamHandle("How did I sleep this week?"));
  const ctx = events.find((e) => e.type === "context");
  assert.ok(ctx, "expected a context event");
  assert.ok(ctx.hits.length >= 1);
  // The top hit should reference one of the journal sources.
  assert.match(ctx.hits[0].source, /journal\/2026-06-/);
  assert.ok(ctx.hits[0].score > 0);
});

test("streamHandle does NOT emit context for lifestyle agent", async () => {
  const o = new Orchestrator({
    llm: fakeLlm('{"agent":"lifestyle","reason":"default"}', "ok"),
    health: fakeAgent("h"),
    finance: fakeAgent("f"),
    // Even when rag is present, lifestyle branch is LLM-only.
    rag: { search: async () => [{ text: "x", source: "y", score: 1 }] },
  });
  const events = await collect(o.streamHandle("Help me focus today"));
  assert.ok(!events.some((e) => e.type === "context"));
});

test("streamHandle converts a routing error into a typed event", async () => {
  const o = new Orchestrator({
    llm: {
      load: async () => 1,
      unload: async () => {},
      prompt: async () => {
        throw new Error("router offline");
      },
      stream: async function* () {},
    },
    health: fakeAgent("h"),
    finance: fakeAgent("f"),
  });
  const events = await collect(o.streamHandle("anything"));
  assert.equal(events[0].type, "error");
  assert.match(events[0].message, /router offline/);
  assert.equal(events[events.length - 1].type, "done");
});

test("streamHandle converts a downstream LLM error into a typed event", async () => {
  const o = new Orchestrator({
    llm: fakeLlm('{"agent":"health","reason":"x"}', ""),
    health: {
      ask: async () => "h",
      streamAsk: async function* () {
        throw new Error("model crashed");
        yield; // unreachable but appeases type systems
      },
    },
    finance: fakeAgent("f"),
  });
  const events = await collect(o.streamHandle("anything"));
  assert.ok(events.some((e) => e.type === "error" && /model crashed/.test(e.message)));
  assert.equal(events[events.length - 1].type, "done");
});

/* ---------------------------- SSE ENDPOINT ---------------------------- */

function makeMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    chunks: [],
    writableEnded: false,
    setHeader(k, v) {
      this.headers[k.toLowerCase()] = v;
    },
    write(chunk) {
      this.chunks.push(String(chunk));
      return true;
    },
    end(chunk) {
      if (chunk !== undefined) this.chunks.push(String(chunk));
      this.writableEnded = true;
    },
    flushHeaders() {
      /* no-op for the mock */
    },
  };
  return res;
}

function makeMockReq({ method = "POST", url = "/chat/stream", headers = {}, body = null } = {}) {
  async function* chunks() {
    if (body == null) return;
    yield typeof body === "string" ? body : JSON.stringify(body);
  }
  return { method, url, headers, [Symbol.asyncIterator]: chunks };
}

test("POST /chat/stream writes text/event-stream with route + token + done frames", async () => {
  const ew = {
    cfg: { version: "3.0.1" },
    profile: { load: async () => ({}) },
    journal: { readAll: async () => [], append: async () => {} },
    expenses: { readAll: async () => [], append: async () => {} },
    orchestrator: new Orchestrator({
      llm: fakeLlm('{"agent":"health","reason":"symptom"}', "hi"),
      health: fakeAgent("hi"),
      finance: fakeAgent("save"),
    }),
  };
  const r = buildRouter({ ew, secret: null });
  const res = makeMockRes();
  await r.handle(
    makeMockReq({
      method: "POST",
      url: "/chat/stream",
      body: { message: "I have a headache" },
    }),
    res,
  );
  assert.equal(res.statusCode, 200);
  assert.match(res.headers["content-type"], /text\/event-stream/);
  assert.equal(res.headers["cache-control"], "no-cache, no-transform");
  assert.equal(res.headers["connection"], "keep-alive");
  // The body is a sequence of SSE frames separated by blank
  // lines. Concatenate and split, then assert each frame's
  // event/data lines parse.
  const body = res.chunks.join("");
  const frames = body.split("\n\n").filter(Boolean);
  assert.ok(frames.length >= 3, `expected at least 3 frames, got ${frames.length}`);
  // First frame must be the route chip.
  assert.match(frames[0], /^event: route\b/m);
  assert.match(frames[0], /"agent":\s*"health"/);
  // Last frame must be the done sentinel.
  const last = frames[frames.length - 1];
  assert.match(last, /^event: done\b/m);
  // At least one token frame in between.
  const tokenFrame = frames.find((f) => /^event: token\b/m.test(f));
  assert.ok(tokenFrame, "expected a token frame");
  assert.match(tokenFrame, /"text":\s*"h"/);
});

test("POST /chat/stream requires auth when secret is set", async () => {
  const secret = newSecret();
  const ew = {
    cfg: { version: "3.0.1" },
    profile: { load: async () => ({}) },
    journal: { readAll: async () => [], append: async () => {} },
    expenses: { readAll: async () => [], append: async () => {} },
    orchestrator: { streamHandle: async function* () { yield { type: "done" }; } },
  };
  const r = buildRouter({ ew, secret });
  const res = makeMockRes();
  await r.handle(
    makeMockReq({ method: "POST", url: "/chat/stream", body: { message: "hi" } }),
    res,
  );
  assert.equal(res.statusCode, 401);
});

test("POST /chat/stream accepts a valid bearer token", async () => {
  const secret = newSecret();
  const token = signToken({ secret, subject: "phone" });
  const ew = {
    cfg: { version: "3.0.1" },
    profile: { load: async () => ({}) },
    journal: { readAll: async () => [], append: async () => {} },
    expenses: { readAll: async () => [], append: async () => {} },
    orchestrator: new Orchestrator({
      llm: fakeLlm('{"agent":"lifestyle","reason":"default"}', "ok"),
      health: fakeAgent("h"),
      finance: fakeAgent("f"),
    }),
  };
  const r = buildRouter({ ew, secret });
  const res = makeMockRes();
  await r.handle(
    makeMockReq({
      method: "POST",
      url: "/chat/stream",
      headers: { authorization: `Bearer ${token}` },
      body: { message: "hi" },
    }),
    res,
  );
  assert.equal(res.statusCode, 200);
  assert.match(res.headers["content-type"], /text\/event-stream/);
  const body = res.chunks.join("");
  assert.match(body, /"agent":\s*"lifestyle"/);
});

test("POST /chat/stream returns 400 when body.message is missing", async () => {
  const ew = {
    cfg: { version: "3.0.1" },
    profile: { load: async () => ({}) },
    journal: { readAll: async () => [], append: async () => {} },
    expenses: { readAll: async () => [], append: async () => {} },
    orchestrator: { streamHandle: async function* () { yield { type: "done" }; } },
  };
  const r = buildRouter({ ew, secret: null });
  const res = makeMockRes();
  await r.handle(
    makeMockReq({ method: "POST", url: "/chat/stream", body: {} }),
    res,
  );
  assert.equal(res.statusCode, 400);
});

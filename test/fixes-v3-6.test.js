// Regression tests for the sixth E2E sweep. Each test pins
// down one of the i18n / error-handling / edge-case bugs
// fixed in this sweep.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { RagIndex } from "../src/rag.js";
import { VectorIndex } from "../src/vector-index.js";
import { hashEmbedder } from "../src/vector-rag.js";
import { JsonlStore } from "../src/store.js";
import { EncryptedJsonlStore } from "../src/encrypted-store.js";
import { ToolRegistry } from "../src/tools.js";

// assert.rejects has a quirk in Node.js test runner: when an async
// function rejects "synchronously" (i.e. before the first microtask
// hop), the rejection escapes the assert.rejects wrapper and is
// reported as an unhandled rejection. The tools.js calculator
// does exactly this — it throws from a sync check before any
// `await`. We use this helper to wrap the call in our own try/catch
// and assert on the error message directly.
async function expectRejects(fn, matcher) {
  let err;
  try {
    await fn();
  } catch (e) {
    err = e;
  }
  assert.ok(err, "expected the function to throw");
  assert.match(err.message, matcher);
}

// ===== i18n: Unicode tokenization =====

test("RagIndex tokenizes Chinese text and searches it", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edgewell-i18n-zh-"));
  const rag = new RagIndex({ dir, chunkSize: 400, chunkOverlap: 50, topK: 5 });
  await rag.ingest({ source: "zh", text: "你好世界 早上好 晚安" });
  // The text was tokenized as Unicode tokens, not ASCII fragments.
  assert.equal(rag.chunks.length, 1);
  assert.deepEqual(rag.chunks[0].tokens, ["你好世界", "早上好", "晚安"]);
  // Exact full-text search hits the chunk.
  const exact = await rag.search("你好世界", 5);
  assert.equal(exact.length, 1);
  await rm(dir, { recursive: true });
});

test("RagIndex tokenizes Arabic, Hebrew, Cyrillic, Hindi, Korean", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edgewell-i18n-many-"));
  const rag = new RagIndex({ dir, chunkSize: 400, chunkOverlap: 50, topK: 5 });
  const cases = [
    ["ar",  "مرحبا بالعالم"],
    ["he",  "שלום עולם"],
    ["ru",  "Привет мир"],
    ["hi",  "नमस्ते दुनिया"],
    ["ko",  "안녕하세요 세계"],
    ["ja",  "こんにちは さようなら"],
    ["th",  "สวัสดี ขอบคุณ"],
  ];
  for (const [lang, text] of cases) {
    await rag.ingest({ source: lang, text });
  }
  // Each non-empty chunk with at least 1 token should be indexed.
  assert.ok(rag.chunks.length >= cases.length, `expected ${cases.length} chunks, got ${rag.chunks.length}`);
  for (const [lang, text] of cases) {
    const hits = await rag.search(text, 5);
    assert.ok(hits.length >= 1, `${lang} search returned 0 hits for "${text}"`);
  }
  await rm(dir, { recursive: true });
});

test("RagIndex no longer requires 3 tokens per chunk", async () => {
  // The old minimum of 3 tokens rejected every short non-Latin
  // chunk (Chinese, Japanese, Arabic) where the user writes
  // one or two tokens per sentence. Single-token chunks are now
  // accepted.
  const dir = await mkdtemp(join(tmpdir(), "edgewell-i18n-min-"));
  const rag = new RagIndex({ dir, chunkSize: 400, chunkOverlap: 50, topK: 5 });
  await rag.ingest({ source: "x", text: "你好" }); // 1 token
  await rag.ingest({ source: "x", text: "مرحبا" }); // 1 token
  assert.equal(rag.chunks.length, 2);
  await rm(dir, { recursive: true });
});

test("RagIndex still filters empty / whitespace-only text", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edgewell-i18n-empty-"));
  const rag = new RagIndex({ dir, chunkSize: 400, chunkOverlap: 50, topK: 5 });
  await rag.ingest({ source: "x", text: "" });
  await rag.ingest({ source: "x", text: "   \n\t  " });
  await rag.ingest({ source: "x", text: "a" }); // 1 char → still empty after length filter
  assert.equal(rag.chunks.length, 0);
  await rm(dir, { recursive: true });
});

test("hashEmbedder produces a non-zero vector for Unicode text", () => {
  const embed = hashEmbedder({ dim: 64 });
  const v1 = embed("hello world");
  const v2 = embed("你好世界 早上好");
  // Both should be unit vectors.
  const len1 = Math.sqrt([...v1].reduce((s, x) => s + x * x, 0));
  const len2 = Math.sqrt([...v2].reduce((s, x) => s + x * x, 0));
  assert.ok(Math.abs(len1 - 1) < 0.01, `English vector should be unit-length, got ${len1}`);
  assert.ok(Math.abs(len2 - 1) < 0.01, `Chinese vector should be unit-length, got ${len2}`);
  // And they should differ — Unicode tokens must contribute to
  // the embedding, not be dropped on the floor.
  let same = true;
  for (let i = 0; i < v1.length; i++) {
    if (Math.abs(v1[i] - v2[i]) > 0.001) { same = false; break; }
  }
  assert.equal(same, false, "English and Chinese embeddings should differ");
});

test("VectorIndex with Unicode text can be searched and the match has a non-zero score", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edgewell-i18n-vidx-"));
  const vidx = new VectorIndex({ dim: 64 });
  await vidx.ingest({ source: "zh", text: "你好世界 早上好 晚安" });
  const hits = await vidx.search("你好世界", 5);
  assert.equal(hits.length, 1);
  assert.ok(hits[0].score > 0, `expected positive score, got ${hits[0].score}`);
  await rm(dir, { recursive: true});
});

// ===== Error handling: clearer errors on invalid append =====

test("JsonlStore.append throws a clear error on null", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edgewell-store-null-"));
  const s = new JsonlStore(join(dir, "j.jsonl"));
  await expectRejects(() => s.append(null), /non-null object/);
  await rm(dir, { recursive: true });
});

test("JsonlStore.append throws a clear error on undefined", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edgewell-store-undef-"));
  const s = new JsonlStore(join(dir, "j.jsonl"));
  await expectRejects(() => s.append(undefined), /non-null object/);
  await rm(dir, { recursive: true });
});

test("JsonlStore.append throws a clear error on a string", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edgewell-store-str-"));
  const s = new JsonlStore(join(dir, "j.jsonl"));
  await expectRejects(() => s.append("hello"), /non-null object/);
  await rm(dir, { recursive: true });
});

test("JsonlStore.append throws a clear error on a number", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edgewell-store-num-"));
  const s = new JsonlStore(join(dir, "j.jsonl"));
  await expectRejects(() => s.append(42), /non-null object/);
  await rm(dir, { recursive: true });
});

test("EncryptedJsonlStore.append throws a clear error on null", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edgewell-enc-null-"));
  const s = new EncryptedJsonlStore(join(dir, "j.jsonl"), { getPassphrase: () => "test" });
  await expectRejects(() => s.append(null), /non-null object/);
  await rm(dir, { recursive: true });
});

test("EncryptedJsonlStore.append throws a clear error on undefined", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edgewell-enc-undef-"));
  const s = new EncryptedJsonlStore(join(dir, "j.jsonl"), { getPassphrase: () => "test" });
  await expectRejects(() => s.append(undefined), /non-null object/);
  await rm(dir, { recursive: true });
});

// ===== Tools / calculator hardening =====

test("calculator rejects the empty string", async () => {
  const reg = new ToolRegistry();
  const calc = reg.tools.calculator;
  // The empty string fails the regex whitelist (which requires
  // at least one digit/operator char) before reaching the
  // "expression is empty" check.
  await expectRejects(() => calc.run({ expression: "" }, {}), /disallowed characters|empty/);
});

test("calculator rejects whitespace-only expressions", async () => {
  const reg = new ToolRegistry();
  const calc = reg.tools.calculator;
  // Whitespace passes the regex (whitespace is in the whitelist)
  // but then trips the "expression is empty" guard.
  await expectRejects(() => calc.run({ expression: "   " }, {}), /empty/);
});

test("calculator returns a finite number for a huge but valid expression", async () => {
  const reg = new ToolRegistry();
  const calc = reg.tools.calculator;
  // 2 ** 1000 is finite in JS (~1.07e301). 2 ** 9999 is Infinity.
  const r1 = await calc.run({ expression: "2**1000" }, {});
  assert.equal(typeof r1.result, "number");
  assert.equal(Number.isFinite(r1.result), true);
  // 2 ** 9999 is Infinity — the calculator correctly rejects it.
  await expectRejects(() => calc.run({ expression: "2**9999" }, {}), /finite/);
});

test("calculator does not call eval on a non-numeric expression", async () => {
  // Defense in depth: the whitelist rejects non-numeric chars
  // before eval, so a hostile expression like
  // `1+1; process.exit(0)` can't escape.
  const reg = new ToolRegistry();
  const calc = reg.tools.calculator;
  await expectRejects(() => calc.run({ expression: "1+1; process.exit(0)" }, {}), /disallowed/);
  await expectRejects(() => calc.run({ expression: "require('fs')" }, {}), /disallowed/);
  await expectRejects(() => calc.run({ expression: "globalThis" }, {}), /disallowed/);
});

// ===== P2P / peer-mesh hardening =====

test("PeerMesh.healthy() with all-dead peers returns []", async () => {
  const { PeerMesh } = await import("../src/peer-mesh.js");
  const mesh = new PeerMesh({
    peers: [
      { host: "127.0.0.1", port: 1, timeoutMs: 100 },
      { host: "127.0.0.1", port: 2, timeoutMs: 100 },
    ],
  });
  const live = await mesh.healthy();
  assert.deepEqual(live, []);
});

test("PeerMesh.stream with all-dead peers throws a clear error", async () => {
  const { PeerMesh } = await import("../src/peer-mesh.js");
  const mesh = new PeerMesh({
    peers: [{ host: "127.0.0.1", port: 1, timeoutMs: 100 }],
  });
  let threw = null;
  try {
    for await (const _ of mesh.stream({ prompt: "x" })) { /* noop */ }
  } catch (e) {
    threw = e;
  }
  assert.ok(threw, "expected stream to throw");
  assert.match(threw.message, /no peers reachable/);
});

test("PeerMesh.broadcast with all-dead peers returns an empty result", async () => {
  const { PeerMesh } = await import("../src/peer-mesh.js");
  const mesh = new PeerMesh({
    peers: [{ host: "127.0.0.1", port: 1, timeoutMs: 100 }],
  });
  const out = await mesh.broadcast({ prompt: "x" });
  assert.equal(out.length, 0);
});

test("PeerMesh.consensus with all-dead peers returns an empty answer", async () => {
  const { PeerMesh } = await import("../src/peer-mesh.js");
  const mesh = new PeerMesh({
    peers: [{ host: "127.0.0.1", port: 1, timeoutMs: 100 }],
  });
  const c = await mesh.consensus({ prompt: "x" });
  assert.equal(c.answer, "");
  assert.deepEqual(c.votes, {});
  assert.equal(c.peers.length, 0);
});

test("PeerClient.prompt against an unreachable peer throws a clear error", async () => {
  const { PeerClient } = await import("../src/p2p.js");
  const peer = new PeerClient({ host: "127.0.0.1", port: 1, timeoutMs: 100, model: "x" });
  await expectRejects(() => peer.prompt({ prompt: "x" }), /peer unreachable/);
});

test("PeerClient.stream against an unreachable peer throws a clear error", async () => {
  const { PeerClient } = await import("../src/p2p.js");
  const peer = new PeerClient({ host: "127.0.0.1", port: 1, timeoutMs: 100, model: "x" });
  let threw = null;
  try {
    for await (const _ of peer.stream({ prompt: "x" })) { /* noop */ }
  } catch (e) {
    threw = e;
  }
  assert.ok(threw, "expected stream to throw");
  assert.match(threw.message, /peer unreachable/);
});

// @ts-nocheck
// Tests for the embedder factory.

import { test } from "node:test";
import assert from "node:assert/strict";
import { makeEmbedder } from "../src/embedder.js";

test("makeEmbedder returns a hash embedder by default", () => {
  const embed = makeEmbedder();
  const v = embed("hello");
  assert.equal(v.length, 128);
});

test("makeEmbedder honours the dim option", () => {
  const embed = makeEmbedder({ dim: 32 });
  const v = embed("hello");
  assert.equal(v.length, 32);
});

test("makeEmbedder kind 'hash' is synchronous and pure", () => {
  const embed = makeEmbedder({ kind: "hash", dim: 16 });
  const a = embed("hello");
  const b = embed("hello");
  for (let i = 0; i < a.length; i++) assert.equal(a[i], b[i]);
});

test("makeEmbedder kind 'qvac' without llm throws", () => {
  assert.throws(() => makeEmbedder({ kind: "qvac" }), /requires an llm/);
});

test("makeEmbedder kind 'qvac' uses llm.embed and returns a Float64Array", async () => {
  const llm = { embed: async (text) => [0.1, 0.2, 0.3, 0.4] };
  const embed = makeEmbedder({ kind: "qvac", llm });
  const v = await embed("hi");
  assert.ok(v instanceof Float64Array);
  assert.equal(v.length, 4);
  assert.equal(v[0], 0.1);
});

test("makeEmbedder throws on unknown kind", () => {
  assert.throws(() => makeEmbedder({ kind: "bogus" }), /unknown embedder kind/);
});

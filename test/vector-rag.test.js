// Tests for the hash embedder and cosine similarity in vector-rag.js.

import { test } from "node:test";
import assert from "node:assert/strict";
import { hashEmbedder, cosine } from "../src/vector-rag.js";

test("hash embedder returns zero vector for empty input", () => {
  const embed = hashEmbedder({ dim: 16 });
  const v = embed("");
  assert.equal(v.length, 16);
  for (const x of v) assert.equal(x, 0);
});

test("hash embedder returns a unit vector for non-empty input", () => {
  const embed = hashEmbedder({ dim: 32 });
  const v = embed("hello world");
  let norm = 0;
  for (const x of v) norm += x * x;
  assert.ok(Math.abs(Math.sqrt(norm) - 1) < 1e-9, `expected unit norm, got ${Math.sqrt(norm)}`);
});

test("hash embedder is deterministic", () => {
  const embed = hashEmbedder({ dim: 64 });
  const a = embed("the quick brown fox");
  const b = embed("the quick brown fox");
  for (let i = 0; i < a.length; i++) assert.equal(a[i], b[i]);
});

test("cosine of identical vectors is ~1", () => {
  const embed = hashEmbedder({ dim: 16 });
  const v = embed("medication");
  assert.ok(cosine(v, v) > 0.999);
});

test("cosine of unrelated texts is small", () => {
  const embed = hashEmbedder({ dim: 256 });
  const a = embed("vitamin d supplement morning");
  const b = embed("electric vehicle charging station");
  assert.ok(cosine(a, b) < 0.5);
});

test("cosine throws on dimension mismatch", () => {
  const a = new Float64Array([1, 0]);
  const b = new Float64Array([1, 0, 0]);
  assert.throws(() => cosine(a, b));
});

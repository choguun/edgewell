// @ts-nocheck
// Tests for the VectorIndex wrapper around embedder + store.

import { test } from "node:test";
import assert from "node:assert/strict";
import { VectorIndex } from "../src/vector-index.js";

test("VectorIndex ingests and finds related text", async () => {
  const idx = new VectorIndex({ dim: 64 });
  await idx.ingest({ source: "med", text: "Take 1000 IU vitamin D with breakfast." });
  await idx.ingest({ source: "car", text: "Rotate tires every 10,000 km." });
  const hits = await idx.search("vitamin d supplement", 1);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].payload.source, "med");
});

test("VectorIndex chunks long text into multiple vectors", async () => {
  const idx = new VectorIndex({ dim: 32, chunkSize: 60, chunkOverlap: 10 });
  const long = "lorem ipsum ".repeat(50);
  const n = await idx.ingest({ source: "doc", text: long });
  assert.ok(n > 1, `expected multiple chunks, got ${n}`);
});

test("VectorIndex uses custom embedder when provided", async () => {
  const calls = [];
  const embed = (text) => {
    calls.push(text);
    const v = new Float64Array(8);
    v[text.length % 8] = 1;
    return v;
  };
  const idx = new VectorIndex({ dim: 8, embedder: embed });
  await idx.ingest({ source: "a", text: "hello" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0], "hello");
});

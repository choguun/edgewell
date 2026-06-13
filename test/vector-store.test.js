// Tests for the in-memory VectorStore.

import { test } from "node:test";
import assert from "node:assert/strict";
import { VectorStore } from "../src/vector-store.js";
import { hashEmbedder } from "../src/vector-rag.js";

test("VectorStore is empty on creation", () => {
  const s = new VectorStore({ dim: 8 });
  assert.equal(s.size(), 0);
});

test("VectorStore upsert and get roundtrip", () => {
  const s = new VectorStore({ dim: 8 });
  const v = new Float64Array([1, 0, 0, 0, 0, 0, 0, 0]);
  s.upsert("a", v, { tag: "x" });
  const rec = s.get("a");
  assert.equal(rec.id, "a");
  assert.equal(rec.payload.tag, "x");
});

test("VectorStore search returns top-k by cosine", () => {
  const s = new VectorStore({ dim: 4 });
  s.upsert("a", new Float64Array([1, 0, 0, 0]));
  s.upsert("b", new Float64Array([0, 1, 0, 0]));
  s.upsert("c", new Float64Array([0.9, 0.1, 0, 0]));
  const hits = s.search(new Float64Array([1, 0, 0, 0]), 2);
  assert.equal(hits.length, 2);
  assert.equal(hits[0].id, "a");
});

test("VectorStore remove deletes a record", () => {
  const s = new VectorStore({ dim: 4 });
  s.upsert("a", new Float64Array([1, 0, 0, 0]));
  assert.equal(s.remove("a"), true);
  assert.equal(s.size(), 0);
});

test("VectorStore rejects mismatched dimensions on upsert", () => {
  const s = new VectorStore({ dim: 4 });
  assert.throws(() => s.upsert("a", new Float64Array([1, 0])));
});

test("VectorStore search works with real embedder", () => {
  const s = new VectorStore({ dim: 32 });
  const embed = hashEmbedder({ dim: 32 });
  s.upsert("med", embed("take vitamin d in the morning"));
  s.upsert("car", embed("check the tire pressure"));
  s.upsert("food", embed("a balanced diet with leafy greens"));
  const hits = s.search(embed("vitamin d supplement"), 2);
  assert.equal(hits[0].id, "med");
});

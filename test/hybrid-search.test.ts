// @ts-nocheck
// Tests for the HybridSearch wrapper that fuses lexical and vector hits.

import { test } from "node:test";
import assert from "node:assert/strict";
import { HybridSearch } from "../src/hybrid-search.js";
import { VectorIndex } from "../src/vector-index.js";

// A minimal stub RagIndex that just returns hits based on substring matching.
function makeLexStub(docs) {
  return {
    async search(query, k = 3) {
      const q = query.toLowerCase();
      const hits = docs
        .filter((d) => d.text.toLowerCase().includes(q))
        .slice(0, k)
        .map((d) => ({ text: d.text, source: d.source, score: 1 }));
      return hits;
    },
  };
}

test("HybridSearch combines lexical and vector results", async () => {
  const docs = [
    { source: "a", text: "vitamin d is fat soluble" },
    { source: "b", text: "credit card balance transfer fees" },
    { source: "c", text: "daily vitamin intake recommendations" },
  ];
  const lex = makeLexStub(docs);
  const vec = new VectorIndex({ dim: 64 });
  for (const d of docs) await vec.ingest({ source: d.source, text: d.text });
  const hs = new HybridSearch({ lexical: lex, vector: vec });
  const out = await hs.search("vitamin d", 3);
  assert.ok(out.length > 0);
  // Both retrievers should rank source "a" at the top, so "a" must
  // appear in the merged results.
  const sources = out.map((h) => h.payload?.source);
  assert.ok(sources.includes("a"), `expected source 'a' in results, got ${JSON.stringify(sources)}`);
  // Every hit should carry a kind tag identifying its retriever.
  for (const h of out) {
    assert.ok(["lexical", "vector"].includes(h.payload?.kind));
  }
});

test("HybridSearch returns at most k results", async () => {
  const docs = [
    { source: "a", text: "alpha beta gamma" },
    { source: "b", text: "alpha delta epsilon" },
    { source: "c", text: "alpha zeta eta" },
  ];
  const lex = makeLexStub(docs);
  const vec = new VectorIndex({ dim: 16 });
  for (const d of docs) await vec.ingest({ source: d.source, text: d.text });
  const hs = new HybridSearch({ lexical: lex, vector: vec });
  const out = await hs.search("alpha", 2);
  assert.equal(out.length, 2);
});

test("HybridSearch returns empty array when nothing matches", async () => {
  const lex = makeLexStub([]);
  const vec = new VectorIndex({ dim: 16 });
  const hs = new HybridSearch({ lexical: lex, vector: vec });
  const out = await hs.search("nope", 5);
  assert.equal(out.length, 0);
});

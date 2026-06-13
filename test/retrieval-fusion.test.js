// Tests for reciprocal rank fusion.

import { test } from "node:test";
import assert from "node:assert/strict";
import { reciprocalRankFusion } from "../src/retrieval-fusion.js";

test("RRF merges two lists and prefers the doc ranked highly in both", () => {
  const a = [{ id: "x" }, { id: "y" }];
  const b = [{ id: "x" }, { id: "z" }];
  const out = reciprocalRankFusion([a, b]);
  assert.equal(out[0].id, "x");
  assert.ok(out[0].score > out[1].score);
});

test("RRF handles a doc that appears in only one list", () => {
  const a = [{ id: "x" }];
  const b = [{ id: "y" }];
  const out = reciprocalRankFusion([a, b]);
  assert.equal(out.length, 2);
  assert.ok(out[0].score > 0);
});

test("RRF with empty list returns empty", () => {
  const out = reciprocalRankFusion([[], []]);
  assert.equal(out.length, 0);
});

test("RRF passes through payload from the first list it sees", () => {
  const a = [{ id: "x", score: 0.9, custom: "from-a" }];
  const b = [{ id: "x", score: 0.5, custom: "from-b" }];
  const out = reciprocalRankFusion([a, b]);
  assert.equal(out[0].payload.custom, "from-a");
});

test("RRF k0 parameter shifts relative weighting", () => {
  const a = [{ id: "x" }, { id: "y" }];
  const b = [{ id: "y" }];
  const lowK = reciprocalRankFusion([a, b], { k0: 1 });
  const highK = reciprocalRankFusion([a, b], { k0: 1000 });
  // With a huge k0 the rank differences wash out and scores converge.
  assert.ok(highK[0].score - highK[1].score < lowK[0].score - lowK[1].score);
});

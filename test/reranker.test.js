// Tests for the bigram re-ranker.

import { test } from "node:test";
import assert from "node:assert/strict";
import { rerank } from "../src/reranker.js";

test("rerank boosts hits that share bigrams with the query", () => {
  const hits = [
    { score: 0.5, payload: { text: "totally unrelated text about cars" } },
    { score: 0.5, payload: { text: "vitamin D and vitamin K work together" } },
  ];
  const out = rerank("vitamin d supplement", hits);
  // The vitamin hit should now be ranked first because of shared bigrams.
  assert.match(out[0].payload.text, /vitamin/i);
});

test("rerank penalises very long chunks", () => {
  const long = "word ".repeat(2000);
  const short = "vitamin d";
  const hits = [
    { score: 0.5, payload: { text: long } },
    { score: 0.5, payload: { text: short } },
  ];
  const out = rerank("vitamin d", hits);
  assert.equal(out[0].payload.text, short);
});

test("rerank returns hits in descending score order", () => {
  const hits = [
    { score: 0.1, payload: { text: "a" } },
    { score: 0.4, payload: { text: "b" } },
    { score: 0.2, payload: { text: "c" } },
  ];
  const out = rerank("anything", hits);
  for (let i = 0; i < out.length - 1; i++) {
    assert.ok(out[i].score >= out[i + 1].score);
  }
});

test("rerank handles hits without payload.text gracefully", () => {
  const hits = [{ score: 0.5, text: "vitamin d" }];
  const out = rerank("vitamin d", hits);
  assert.equal(out.length, 1);
});

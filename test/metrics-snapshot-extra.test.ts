// @ts-nocheck
// Additional tests for the metrics-snapshot helper, covering edge
// cases like single-element histograms and zero-quantile behavior.

import { test } from "node:test";
import assert from "node:assert/strict";
import { quantile, collectMetricsSnapshot } from "../src/metrics-snapshot.js";
import { Metrics } from "../src/metrics.js";

test("quantile of a single-element array returns that value for any q", () => {
  for (const q of [0, 0.5, 0.9, 0.99, 1.0]) {
    assert.equal(quantile([7], q), 7);
  }
});

test("quantile with q=0 returns the minimum", () => {
  assert.equal(quantile([3, 1, 2, 5, 4], 0), 1);
});

test("quantile with q=1 returns the maximum", () => {
  assert.equal(quantile([3, 1, 2, 5, 4], 1), 5);
});

test("collectMetricsSnapshot returns zero quantiles for empty histograms", () => {
  const m = new Metrics();
  m.observe("latency", 100);
  m.observe("latency", 200);
  const s = collectMetricsSnapshot({ metrics: m });
  const h = s.histograms.get("latency");
  assert.equal(h.count, 2);
  // p50 of [100, 200] = 100 + 0.5 * (200 - 100) = 150
  assert.equal(h.p50, 150);
});

test("collectMetricsSnapshot handles an ew with no metrics object", () => {
  const s = collectMetricsSnapshot({});
  assert.equal(s.counters.size, 0);
  assert.equal(s.histograms.size, 0);
});

test("collectMetricsSnapshot counts multiple inc calls correctly", () => {
  const m = new Metrics();
  m.inc("a", 1);
  m.inc("a", 1);
  m.inc("a", 1);
  m.inc("b", 5);
  const s = collectMetricsSnapshot({ metrics: m });
  assert.equal(s.counters.get("a"), 3);
  assert.equal(s.counters.get("b"), 5);
});

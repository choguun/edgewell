// @ts-nocheck
// Tests for the metrics snapshot helper and quantile function.

import { test } from "node:test";
import assert from "node:assert/strict";
import { collectMetricsSnapshot, quantile } from "../src/metrics-snapshot.js";
import { Metrics } from "../src/metrics.js";

test("quantile of empty array is 0", () => {
  assert.equal(quantile([], 0.5), 0);
  assert.equal(quantile([], 0.9), 0);
});

test("quantile of single value is that value", () => {
  assert.equal(quantile([42], 0.5), 42);
  assert.equal(quantile([42], 0.99), 42);
});

test("quantile of [1..10] gives 1, 5, 9, 9.9", () => {
  const xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  assert.equal(quantile(xs, 0.0), 1);
  assert.equal(quantile(xs, 0.5), 5.5);
  assert.equal(quantile(xs, 0.9), 9.1);
  assert.equal(quantile(xs, 0.99), 9.91);
});

test("quantile works on an unsorted array", () => {
  assert.equal(quantile([3, 1, 2], 0.5), 2);
});

test("collectMetricsSnapshot returns empty maps when there is no metrics object", () => {
  const s = collectMetricsSnapshot({});
  assert.equal(s.counters.size, 0);
  assert.equal(s.histograms.size, 0);
});

test("collectMetricsSnapshot copies counters and computes quantiles", () => {
  const m = new Metrics();
  m.inc("chat.requests", 3);
  m.inc("chat.tokens", 117);
  m.observe("chat.latency_ms", 80);
  m.observe("chat.latency_ms", 120);
  m.observe("chat.latency_ms", 200);
  m.observe("chat.latency_ms", 1000);
  const s = collectMetricsSnapshot({ metrics: m });
  assert.equal(s.counters.get("chat.requests"), 3);
  assert.equal(s.counters.get("chat.tokens"), 117);
  const h = s.histograms.get("chat.latency_ms");
  assert.equal(h.count, 4);
  // p50 of [80, 120, 200, 1000] = 160
  assert.equal(h.p50, 160);
  // p90 of [80, 120, 200, 1000] ≈ 760
  assert.equal(Math.round(h.p90), 760);
  // p99 of [80, 120, 200, 1000] ≈ 976
  assert.equal(Math.round(h.p99), 976);
});

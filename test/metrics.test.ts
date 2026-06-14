// @ts-nocheck
import { test } from "node:test";
import assert from "node:assert/strict";
import { Metrics, timed } from "../src/metrics.js";

test("Metrics.inc counts and snapshots", () => {
  const m = new Metrics();
  m.inc("requests");
  m.inc("requests", 2);
  m.inc("requests", 1, { path: "/health" });
  const snap = m.snapshot();
  assert.equal(snap.counters.requests, 3);
  assert.equal(snap.counters["requests{path=/health}"], 1);
});

test("Metrics.observe computes quantiles", () => {
  const m = new Metrics();
  for (let i = 1; i <= 100; i++) m.observe("latency", i);
  const snap = m.snapshot();
  assert.equal(snap.histograms.latency.count, 100);
  assert.equal(snap.histograms.latency.min, 1);
  assert.equal(snap.histograms.latency.max, 100);
  assert.ok(snap.histograms.latency.p50 >= 49);
  assert.ok(snap.histograms.latency.p90 >= 89);
});

test("timed records duration", async () => {
  const m = new Metrics();
  await timed(m, "fn", {}, async () => {
    await new Promise((r) => setTimeout(r, 5));
    return "ok";
  });
  const snap = m.snapshot();
  assert.equal(snap.histograms.fn.count, 1);
  assert.ok(snap.histograms.fn.mean >= 4);
});

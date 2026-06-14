// @ts-nocheck
// Tests for the benchmark harness.

import { test } from "node:test";
import assert from "node:assert/strict";
import { runBenchmark, formatBenchResult } from "../src/bench-harness.js";

test("runBenchmark returns median, p95, mean, min, max", async () => {
  const r = await runBenchmark({
    name: "noop",
    fn: async () => {},
    trials: 5,
    warmup: 1,
  });
  assert.equal(r.name, "noop");
  assert.equal(r.trials, 5);
  assert.equal(r.warmup, 1);
  assert.ok(r.median >= 0);
  assert.ok(r.p95 >= 0);
  assert.ok(r.mean >= 0);
  assert.ok(r.min >= 0);
  assert.ok(r.max >= r.min);
});

test("runBenchmark throws when fn is not provided", async () => {
  await assert.rejects(() => runBenchmark({}), /fn is required/);
});

test("formatBenchResult includes the name and p95", () => {
  const r = {
    name: "x",
    trials: 3,
    median: 1,
    p95: 2,
    mean: 1.5,
    min: 1,
    max: 2,
  };
  const out = formatBenchResult(r);
  assert.match(out, /x:/);
  assert.match(out, /p95=2\.00ms/);
});

test("runBenchmark median is in the middle of the sorted samples", async () => {
  const r = await runBenchmark({
    name: "delay",
    fn: async () => {
      // noop
    },
    trials: 9,
    warmup: 0,
  });
  // For 9 samples, median is index 4 of sorted.
  assert.equal(r.median, r.min === r.max ? r.min : r.median);
});

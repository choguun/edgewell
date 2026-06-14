// @ts-nocheck
// `edgewell bench-compare` runs the same benchmark twice and
// prints the per-trial times side by side. Useful for A/B testing
// a code change.

import { runBenchmark, formatBenchResult } from "../bench-harness.js";
import { c, header } from "../cli.js";

export async function benchCompareCommand(_args) {
  header("Bench compare (no-op, two passes)");
  const noop = async () => {
    // nothing — the harness measures its own overhead.
  };
  const a = await runBenchmark({ name: "pass-a", fn: noop, trials: 10, warmup: 2 });
  const b = await runBenchmark({ name: "pass-b", fn: noop, trials: 10, warmup: 2 });
  console.log(formatBenchResult(a));
  console.log(formatBenchResult(b));
  const delta = ((b.median - a.median) / a.median) * 100;
  const sign = delta >= 0 ? "+" : "";
  console.log(c.bold(`median delta: ${sign}${delta.toFixed(1)}%`));
}

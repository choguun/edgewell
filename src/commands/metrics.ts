// @ts-nocheck
// `edgewell metrics` prints the in-process counters and histograms
// collected by `src/metrics.js`. v3.0.0 keeps the data structure
// simple: a `Map<name, number>` for counters and a list of samples
// for each histogram.

import { c, header } from "../cli.js";
import { collectMetricsSnapshot } from "../metrics-snapshot.js";

export async function metricsCommand(_args, ew) {
  header("EdgeWell metrics");
  const snap = collectMetricsSnapshot(ew);
  if (snap.counters.size === 0 && snap.histograms.size === 0) {
    console.log(c.dim("(no metrics recorded yet)"));
    return;
  }
  if (snap.counters.size > 0) {
    console.log(c.bold("counters:"));
    for (const [k, v] of snap.counters) {
      console.log(`  ${k.padEnd(28)} ${v}`);
    }
  }
  if (snap.histograms.size > 0) {
    console.log(c.bold("histograms:"));
    for (const [k, h] of snap.histograms) {
      console.log(`  ${k.padEnd(28)} n=${h.count} p50=${h.p50} p90=${h.p90} p99=${h.p99}`);
    }
  }
}

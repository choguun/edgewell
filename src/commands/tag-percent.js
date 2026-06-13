// `edgewell tag-percent` prints the percentage distribution of
// the top 10 tags. v3.0.0 keeps the aggregation offline.

import { c, header } from "../cli.js";

export async function tagPercentCommand(_args, ew) {
  header("Tag percentage");
  const all = await ew.journal.readAll();
  const counts = new Map();
  for (const e of all) {
    for (const t of e.tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  if (counts.size === 0) {
    console.log(c.dim("(no tagged entries)"));
    return;
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  for (const [t, n] of sorted) {
    const pct = (n / total) * 100;
    console.log(`  ${c.cyan(t.padEnd(16))} ${pct.toFixed(1).padStart(5)}%`);
  }
}

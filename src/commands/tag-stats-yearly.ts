// @ts-nocheck
// `edgewell tag-stats-yearly` lists the top tag per year.
// v3.0.0 keeps the aggregation offline.

import { c, header } from "../cli.js";

export async function tagStatsYearlyCommand(_args, ew) {
  header("Tag stats (yearly)");
  const all = await ew.journal.readAll();
  const byYear = new Map();
  for (const e of all) {
    const year = (e._ts ?? "").slice(0, 4);
    if (!byYear.has(year)) byYear.set(year, new Map());
    for (const t of e.tags ?? []) {
      const inner = byYear.get(year);
      inner.set(t, (inner.get(t) ?? 0) + 1);
    }
  }
  for (const [year, tags] of [...byYear.entries()].sort()) {
    const sorted = [...tags.entries()].sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) continue;
    const [topTag, topCount] = sorted[0];
    console.log(`  ${c.cyan(year)}  top: ${c.dim(topTag)} (${topCount})`);
  }
}

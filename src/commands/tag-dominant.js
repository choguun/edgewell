// `edgewell tag-dominant` lists the most common tag per month.
// v3.0.0 keeps the aggregation offline. Sibling to
// `tag-stats-monthly` but with a more visible header.

import { c, header } from "../cli.js";

export async function tagDominantCommand(_args, ew) {
  header("Dominant tag per month");
  const all = await ew.journal.readAll();
  const byMonth = new Map();
  for (const e of all) {
    const month = (e._ts ?? "").slice(0, 7);
    if (!byMonth.has(month)) byMonth.set(month, new Map());
    for (const t of e.tags ?? []) {
      const inner = byMonth.get(month);
      inner.set(t, (inner.get(t) ?? 0) + 1);
    }
  }
  for (const [month, tags] of [...byMonth.entries()].sort()) {
    const sorted = [...tags.entries()].sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) continue;
    const [topTag, topCount] = sorted[0];
    console.log(`  ${c.cyan(month)}  ${topTag} (${topCount})`);
  }
}

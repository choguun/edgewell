// @ts-nocheck
// `edgewell tag-stats-monthly-detailed` is a more verbose
// version of `tag-stats-monthly` that lists the top 3 tags
// per month instead of just the top 1. v3.0.0 keeps the
// aggregation offline.

import { c, header } from "../cli.js";

export async function tagStatsMonthlyDetailedCommand(_args, ew) {
  header("Tag stats (monthly, detailed)");
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
    const sorted = [...tags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (sorted.length === 0) continue;
    console.log(`  ${c.cyan(month)}  ${sorted.map(([t, n]) => `${t} (${n})`).join(", ")}`);
  }
}

// `edgewell tag-stats-yearly-detailed` is the detailed
// version of `tag-stats-yearly`: top 3 per year.

import { c, header } from "../cli.js";

export async function tagStatsYearlyDetailedCommand(_args, ew) {
  header("Tag stats (yearly, detailed)");
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
    const sorted = [...tags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (sorted.length === 0) continue;
    console.log(`  ${c.cyan(year)}  ${sorted.map(([t, n]) => `${t} (${n})`).join(", ")}`);
  }
}

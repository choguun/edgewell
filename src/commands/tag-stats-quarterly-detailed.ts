// @ts-nocheck
// `edgewell tag-stats-quarterly-detailed` is the detailed
// version of `tag-stats-quarterly`: top 3 per quarter.

import { c, header } from "../cli.js";

function quarterOf(month) {
  return Math.ceil(month / 3);
}

function quarterKey(date) {
  const month = Number(date.slice(5, 7));
  const year = date.slice(0, 4);
  return `${year}-Q${quarterOf(month)}`;
}

export async function tagStatsQuarterlyDetailedCommand(_args, ew) {
  header("Tag stats (quarterly, detailed)");
  const all = await ew.journal.readAll();
  const byQuarter = new Map();
  for (const e of all) {
    const key = quarterKey((e._ts ?? "").slice(0, 10));
    if (!byQuarter.has(key)) byQuarter.set(key, new Map());
    for (const t of e.tags ?? []) {
      const inner = byQuarter.get(key);
      inner.set(t, (inner.get(t) ?? 0) + 1);
    }
  }
  for (const [key, tags] of [...byQuarter.entries()].sort()) {
    const sorted = [...tags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (sorted.length === 0) continue;
    console.log(`  ${c.cyan(key)}  ${sorted.map(([t, n]) => `${t} (${n})`).join(", ")}`);
  }
}

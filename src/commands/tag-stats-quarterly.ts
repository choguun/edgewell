// @ts-nocheck
// `edgewell tag-stats-quarterly` lists the top tag per
// quarter. v3.0.0 keeps the aggregation offline.

import { c, header } from "../cli.js";

function quarterOf(month) {
  return Math.ceil(month / 3);
}

function quarterKey(date) {
  const month = Number(date.slice(5, 7));
  const year = date.slice(0, 4);
  return `${year}-Q${quarterOf(month)}`;
}

export async function tagStatsQuarterlyCommand(_args, ew) {
  header("Tag stats (quarterly)");
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
    const sorted = [...tags.entries()].sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) continue;
    const [topTag, topCount] = sorted[0];
    console.log(`  ${c.cyan(key)}  top: ${c.dim(topTag)} (${topCount})`);
  }
}

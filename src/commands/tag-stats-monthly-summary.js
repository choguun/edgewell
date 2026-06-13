// `edgewell tag-stats-monthly-summary` is a one-line summary
// of the tag usage per month. v3.0.0 keeps the aggregation
// offline.

import { c } from "../cli.js";

export async function tagStatsMonthlySummaryCommand(_args, ew) {
  const all = await ew.journal.readAll();
  const byMonth = new Map();
  for (const e of all) {
    const month = (e._ts ?? "").slice(0, 7);
    if (!byMonth.has(month)) byMonth.set(month, new Set());
    for (const t of e.tags ?? []) byMonth.get(month).add(t);
  }
  if (byMonth.size === 0) {
    console.log(c.dim("(no tags yet)"));
    return;
  }
  const total = [...byMonth.values()].reduce((s, set) => s + set.size, 0);
  console.log(`${byMonth.size} months with tags, ${total} tag-uses`);
}

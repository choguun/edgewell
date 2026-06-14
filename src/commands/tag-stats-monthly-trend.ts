// @ts-nocheck
// `edgewell tag-stats-monthly-trend` lists the total tag count
// per month as an ASCII bar chart. v3.0.0 keeps the aggregation
// offline.

import { c, header } from "../cli.js";

export async function tagStatsMonthlyTrendCommand(_args, ew) {
  header("Tag uses by month");
  const all = await ew.journal.readAll();
  const byMonth = new Map();
  for (const e of all) {
    const month = (e._ts ?? "").slice(0, 7);
    const n = (e.tags ?? []).length;
    if (n === 0) continue;
    byMonth.set(month, (byMonth.get(month) ?? 0) + n);
  }
  if (byMonth.size === 0) {
    console.log(c.dim("(no tagged entries)"));
    return;
  }
  const max = Math.max(...byMonth.values());
  for (const [month, n] of [...byMonth.entries()].sort()) {
    const bar = "#".repeat(Math.round((n / max) * 20));
    console.log(`  ${month}  ${String(n).padStart(3)}  ${bar}`);
  }
}

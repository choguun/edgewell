// @ts-nocheck
// `edgewell journal-stats-by-day` prints the entry count per
// day as an ASCII bar chart. v3.0.0 keeps the aggregation
// offline.

import { c, header } from "../cli.js";

export async function journalStatsByDayCommand(_args, ew) {
  header("Journal entries by day");
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const byDay = new Map();
  for (const e of all) {
    const d = (e._ts ?? "").slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }
  const max = Math.max(...byDay.values());
  for (const [day, n] of [...byDay.entries()].sort().slice(-15)) {
    const bar = "#".repeat(Math.max(1, Math.round((n / max) * 20)));
    console.log(`  ${day}  ${String(n).padStart(3)}  ${bar}`);
  }
}

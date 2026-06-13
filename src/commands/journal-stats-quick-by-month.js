// `edgewell journal-stats-quick-by-month` is a one-line
// summary grouped by month. v3.0.0 keeps the aggregation
// offline.

import { c } from "../cli.js";

export async function journalStatsQuickByMonthCommand(_args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const byMonth = new Map();
  for (const e of all) {
    const month = (e._ts ?? "").slice(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0) + 1);
  }
  const sorted = [...byMonth.entries()].sort();
  for (const [m, n] of sorted) {
    console.log(`  ${m}  ${n}`);
  }
}

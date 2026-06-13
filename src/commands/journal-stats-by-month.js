// `edgewell journal-stats-by-month` prints the journal entry
// count per month as an ASCII bar chart. v3.0.0 keeps the
// aggregation offline.

import { c, header } from "../cli.js";

export async function journalStatsByMonthCommand(_args, ew) {
  header("Journal entries by month");
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
  const max = Math.max(...byMonth.values());
  for (const [month, n] of [...byMonth.entries()].sort()) {
    const bar = "#".repeat(Math.round((n / max) * 20));
    console.log(`  ${month}  ${String(n).padStart(3)}  ${bar}`);
  }
}

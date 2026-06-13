// `edgewell expenses-stats-by-tag` prints the per-tag breakdown
// of expense totals. v3.0.0 keeps the aggregation offline.

import { c, header } from "../cli.js";

export async function expensesStatsByTagCommand(_args, ew) {
  header("Expenses totals by tag");
  const all = await ew.expenses.readAll();
  const totals = new Map();
  for (const e of all) {
    for (const t of e.tags ?? []) {
      totals.set(t, (totals.get(t) ?? 0) + Number(e.amount ?? 0));
    }
  }
  if (totals.size === 0) {
    console.log(c.dim("(no tagged expenses)"));
    return;
  }
  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  for (const [t, v] of sorted) {
    console.log(`  ${c.cyan(t.padEnd(16))} ${v.toFixed(2)}`);
  }
}

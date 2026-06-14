// @ts-nocheck
// `edgewell expenses-stats-quick-by-month` is the sibling of
// `journal-stats-quick-by-month` for expenses.

import { c } from "../cli.js";

export async function expensesStatsQuickByMonthCommand(_args, ew) {
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const byMonth = new Map();
  for (const e of all) {
    const month = (e._ts ?? "").slice(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0) + Number(e.amount ?? 0));
  }
  const sorted = [...byMonth.entries()].sort();
  for (const [m, v] of sorted) {
    console.log(`  ${m}  ${v.toFixed(2)}`);
  }
}

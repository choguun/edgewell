// @ts-nocheck
// `edgewell expenses-stats-by-month` prints the total expense
// per month as an ASCII bar chart. v3.0.0 keeps the aggregation
// offline.

import { c, header } from "../cli.js";

export async function expensesStatsByMonthCommand(_args, ew) {
  header("Expenses totals by month");
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
  const max = Math.max(...byMonth.values());
  for (const [month, v] of [...byMonth.entries()].sort()) {
    const bar = "#".repeat(Math.max(1, Math.round((v / max) * 20)));
    console.log(`  ${month}  ${v.toFixed(2).padStart(8)}  ${bar}`);
  }
}

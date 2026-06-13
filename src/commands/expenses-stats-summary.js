// `edgewell expenses-stats-summary` prints a one-line summary
// of the expenses. v3.0.0 keeps the aggregation offline.

import { c } from "../cli.js";

export async function expensesStatsSummaryCommand(_args, ew) {
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses yet)"));
    return;
  }
  const total = all.reduce((s, e) => s + Number(e.amount ?? 0), 0);
  const cats = new Set(all.map((e) => e.category ?? "other"));
  console.log(`${all.length} expenses, total ${total.toFixed(2)}, ${cats.size} categories`);
}

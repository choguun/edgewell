// @ts-nocheck
// `edgewell expenses-month-summary <YYYY-MM>` prints a one-line
// summary of an expenses month. v3.0.0 keeps the aggregation
// offline.

import { c } from "../cli.js";

export async function expensesMonthSummaryCommand(args, ew) {
  const month = args[0];
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    console.error("usage: edgewell expenses-month-summary <YYYY-MM>");
    process.exit(2);
  }
  const all = await ew.expenses.readAll();
  const matches = all.filter((e) => (e._ts ?? "").startsWith(month));
  if (matches.length === 0) {
    console.log(c.dim("(no expenses in this month)"));
    return;
  }
  const total = matches.reduce((s, e) => s + Number(e.amount ?? 0), 0);
  const byCat = new Map();
  for (const e of matches) byCat.set(e.category ?? "other", (byCat.get(e.category ?? "other") ?? 0) + Number(e.amount ?? 0));
  const top = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  console.log(`${month}: ${matches.length} expenses, total ${total.toFixed(2)}; top: ${top.map(([c, v]) => `${c} ${v.toFixed(2)}`).join(", ")}`);
}

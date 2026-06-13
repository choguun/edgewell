// `edgewell expenses-stats-extended` is a richer version of
// `expenses-stats` that also breaks down by month. v3.0.0 keeps
// the aggregation offline.

import { c, header } from "../cli.js";

export async function expensesStatsExtendedCommand(_args, ew) {
  header("Expenses stats (extended)");
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses yet)"));
    return;
  }
  const byMonth = new Map();
  for (const e of all) {
    const month = (e._ts ?? "").slice(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0) + Number(e.amount ?? 0));
  }
  const total = [...byMonth.values()].reduce((a, b) => a + b, 0);
  console.log(`${c.bold("total:")} ${total.toFixed(2)}`);
  console.log(c.dim("by month:"));
  for (const [m, v] of [...byMonth.entries()].sort()) {
    console.log(`  ${m}  ${v.toFixed(2)}`);
  }
}

// @ts-nocheck
// `edgewell expenses-busiest-day` prints the day with the
// highest total expenses. v3.0.0 keeps the aggregation
// offline.

import { c } from "../cli.js";

export async function expensesBusiestDayCommand(_args, ew) {
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const byDay = new Map();
  for (const e of all) {
    const day = (e._ts ?? "").slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + Number(e.amount ?? 0));
  }
  let best = null;
  let bestTotal = 0;
  for (const [day, n] of byDay) {
    if (n > bestTotal) {
      best = day;
      bestTotal = n;
    }
  }
  console.log(`${c.bold("biggest day:")} ${best} (${bestTotal.toFixed(2)})`);
}

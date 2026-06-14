// @ts-nocheck
// `edgewell expenses-by-day` lists daily totals from the expense
// log. v3.0.0 keeps the aggregation in JS so no model is needed.

import { c, header } from "../cli.js";

function dayKey(ts) {
  return (ts ?? "").slice(0, 10);
}

export async function expensesByDayCommand(_args, ew) {
  header("Expenses by day");
  const all = await ew.expenses.readAll();
  const byDay = new Map();
  for (const e of all) {
    const k = dayKey(e._ts);
    byDay.set(k, (byDay.get(k) ?? 0) + Number(e.amount ?? 0));
  }
  if (byDay.size === 0) {
    console.log(c.dim("(no expenses yet)"));
    return;
  }
  const sorted = [...byDay.entries()].sort();
  for (const [day, total] of sorted.slice(-15)) {
    const bar = "#".repeat(Math.max(0, Math.min(20, Math.round(total / 10))));
    console.log(`${c.dim(day)} ${String(total.toFixed(2)).padStart(8)}  ${bar}`);
  }
}

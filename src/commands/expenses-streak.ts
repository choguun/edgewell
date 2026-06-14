// @ts-nocheck
// `edgewell expenses-streak` reports the longest consecutive
// streak of days with at least one expense logged. v3.0.0 keeps
// the calculation in JS.

import { c, header } from "../cli.js";

export async function expensesStreakCommand(_args, ew) {
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses yet)"));
    return;
  }
  const days = new Set(all.map((e) => (e._ts ?? "").slice(0, 10)).filter(Boolean));
  const sorted = [...days].sort();
  let best = 0;
  let current = 0;
  let prev = null;
  for (const d of sorted) {
    if (prev) {
      const a = new Date(prev).getTime();
      const b = new Date(d).getTime();
      if (b - a === 86400_000) {
        current++;
      } else {
        current = 1;
      }
    } else {
      current = 1;
    }
    if (current > best) best = current;
    prev = d;
  }
  header("Expenses streak");
  console.log(`${c.bold("longest:")} ${best} days`);
  console.log(`${c.bold("days with expenses:")} ${days.size}`);
}

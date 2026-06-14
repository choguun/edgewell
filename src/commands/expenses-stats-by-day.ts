// @ts-nocheck
// `edgewell expenses-stats-by-day` prints the daily total
// expenses as an ASCII bar chart. Sibling to
// `journal-stats-by-day`.

import { c, header } from "../cli.js";

export async function expensesStatsByDayCommand(_args, ew) {
  header("Expenses totals by day");
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const byDay = new Map();
  for (const e of all) {
    const d = (e._ts ?? "").slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + Number(e.amount ?? 0));
  }
  const max = Math.max(...byDay.values());
  for (const [day, v] of [...byDay.entries()].sort().slice(-15)) {
    const bar = "#".repeat(Math.max(1, Math.round((v / max) * 20)));
    console.log(`  ${day}  ${v.toFixed(2).padStart(8)}  ${bar}`);
  }
}

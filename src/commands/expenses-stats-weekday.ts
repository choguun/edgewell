// @ts-nocheck
// `edgewell expenses-stats-weekday` prints the total expense
// amount by day of the week. Sibling to
// `journal-stats-weekday`.

import { c, header } from "../cli.js";

const NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function expensesStatsWeekdayCommand(_args, ew) {
  header("Expenses by weekday");
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const totals = new Array(7).fill(0);
  for (const e of all) {
    const d = new Date(e._ts).getUTCDay();
    totals[d] += Number(e.amount ?? 0);
  }
  for (let i = 0; i < 7; i++) {
    const bar = "#".repeat(Math.max(0, Math.min(20, Math.round(totals[i] / 10))));
    console.log(`  ${c.cyan(NAMES[i])}  ${totals[i].toFixed(2).padStart(8)}  ${bar}`);
  }
}

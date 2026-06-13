// `edgewell expenses-stats-quick-by-weekday` is the sibling of
// `journal-stats-quick-by-weekday` for expenses.

import { c } from "../cli.js";

const NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function expensesStatsQuickByWeekdayCommand(_args, ew) {
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const totals = new Array(7).fill(0);
  for (const e of all) {
    totals[new Date(e._ts).getUTCDay()] += Number(e.amount ?? 0);
  }
  for (let i = 0; i < 7; i++) {
    console.log(`  ${NAMES[i]}  ${totals[i].toFixed(2)}`);
  }
}

// @ts-nocheck
// `edgewell expenses-busiest-weekday` prints the day of the
// week with the highest total expenses. Sibling to
// `journal-busiest-weekday`.

import { c } from "../cli.js";

const NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function expensesBusiestWeekdayCommand(_args, ew) {
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
  let best = 0;
  for (let i = 1; i < 7; i++) {
    if (totals[i] > totals[best]) best = i;
  }
  console.log(`${c.bold("biggest weekday:")} ${NAMES[best]} (${totals[best].toFixed(2)})`);
}

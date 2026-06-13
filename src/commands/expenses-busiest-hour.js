// `edgewell expenses-busiest-hour` prints the hour of the day
// with the highest total expenses. Sibling to
// `journal-busiest-hour`.

import { c } from "../cli.js";

export async function expensesBusiestHourCommand(_args, ew) {
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const totals = new Array(24).fill(0);
  for (const e of all) {
    const d = new Date(e._ts);
    totals[d.getUTCHours()] += Number(e.amount ?? 0);
  }
  let best = 0;
  for (let i = 1; i < 24; i++) {
    if (totals[i] > totals[best]) best = i;
  }
  console.log(`${c.bold("biggest hour:")} ${String(best).padStart(2, "0")}:00 UTC (${totals[best].toFixed(2)})`);
}

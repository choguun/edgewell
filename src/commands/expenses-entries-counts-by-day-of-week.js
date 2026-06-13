// `edgewell expenses-entries-counts-by-day-of-week` lists a
// count of expenses grouped by day-of-week.

import { c } from "../cli.js";

const DOW_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function expensesEntriesCountsByDayOfWeekCommand(args, ew) {
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const counts = new Array(7).fill(0);
  for (const e of all) {
    const d = new Date(e._ts);
    if (Number.isNaN(d.getTime())) continue;
    counts[d.getUTCDay()]++;
  }
  for (let i = 0; i < 7; i++) {
    console.log(`${DOW_NAMES[i]}  ${counts[i]}`);
  }
}

// @ts-nocheck
// `edgewell expenses-entries-counts-by-hour` lists a count
// of expenses grouped by hour-of-day.

import { c } from "../cli.js";

export async function expensesEntriesCountsByHourCommand(args, ew) {
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const counts = new Array(24).fill(0);
  for (const e of all) {
    const d = new Date(e._ts);
    if (Number.isNaN(d.getTime())) continue;
    counts[d.getUTCHours()]++;
  }
  for (let h = 0; h < 24; h++) {
    console.log(`${String(h).padStart(2, "0")}  ${counts[h]}`);
  }
}

// `edgewell expenses-entries-counts-by-month-of-year`
// lists a count of expenses grouped by month-of-year.

import { c } from "../cli.js";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export async function expensesEntriesCountsByMonthOfYearCommand(args, ew) {
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const counts = new Array(12).fill(0);
  for (const e of all) {
    const m = Number((e._ts ?? "").slice(5, 7));
    if (!m || m < 1 || m > 12) continue;
    counts[m - 1]++;
  }
  for (let m = 0; m < 12; m++) {
    console.log(`${MONTH_NAMES[m]}  ${counts[m]}`);
  }
}

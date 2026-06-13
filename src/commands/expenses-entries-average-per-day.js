// `edgewell expenses-entries-average-per-day` reports the
// average number of expenses per active day. Sibling to
// `journal-entries-average-per-day`.

import { c } from "../cli.js";

function dayKey(ts) {
  return (ts ?? "").slice(0, 10);
}

export async function expensesEntriesAveragePerDayCommand(_args, ew) {
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const days = new Set(all.map((e) => dayKey(e._ts)));
  const avg = all.length / days.size;
  console.log(avg.toFixed(2));
}

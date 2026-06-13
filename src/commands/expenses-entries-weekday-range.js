// `edgewell expenses-entries-weekday-range <0..6>
// <start-YYYY-MM-DD> <end-YYYY-MM-DD>` lists the expenses
// on a specific day-of-week in the inclusive range.

import { c } from "../cli.js";

export async function expensesEntriesWeekdayRangeCommand(args, ew) {
  const dow = Number(args[0]);
  const start = String(args[1] ?? "");
  const end = String(args[2] ?? "");
  if (!Number.isFinite(dow) || dow < 0 || dow > 6
      || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || start > end) {
    console.error("usage: edgewell expenses-entries-weekday-range <0..6> <start-YYYY-MM-DD> <end-YYYY-MM-DD>");
    process.exit(2);
  }
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const matches = all.filter((e) => {
    const d = (e._ts ?? "").slice(0, 10);
    if (d < start || d > end) return false;
    return new Date(d).getUTCDay() === dow;
  });
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses on day-of-week ${dow} in ${start}..${end})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

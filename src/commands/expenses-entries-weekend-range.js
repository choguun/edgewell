// `edgewell expenses-entries-weekend-range <start-YYYY-MM-DD>
// <end-YYYY-MM-DD>` lists the expenses on weekend days in
// the inclusive range.

import { c } from "../cli.js";

export async function expensesEntriesWeekendRangeCommand(args, ew) {
  const start = String(args[0] ?? "");
  const end = String(args[1] ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || start > end) {
    console.error("usage: edgewell expenses-entries-weekend-range <start-YYYY-MM-DD> <end-YYYY-MM-DD>");
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
    const dt = new Date(d);
    const dow = dt.getUTCDay();
    return dow === 0 || dow === 6;
  });
  if (matches.length === 0) {
    console.log(c.dim(`(no weekend expenses in ${start}..${end})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

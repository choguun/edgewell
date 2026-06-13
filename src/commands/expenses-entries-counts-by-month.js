// `edgewell expenses-entries-counts-by-month` lists a count
// of expenses per month.

import { c } from "../cli.js";

export async function expensesEntriesCountsByMonthCommand(args, ew) {
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const counts = new Map();
  for (const e of all) {
    const ym = (e._ts ?? "").slice(0, 7);
    if (!ym) continue;
    counts.set(ym, (counts.get(ym) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort();
  for (const [ym, n] of sorted) {
    console.log(`${ym}  ${n}`);
  }
}

// @ts-nocheck
// `edgewell expenses-entries-counts-by-year` lists a count
// of expenses per year.

import { c } from "../cli.js";

export async function expensesEntriesCountsByYearCommand(args, ew) {
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const counts = new Map();
  for (const e of all) {
    const y = (e._ts ?? "").slice(0, 4);
    if (!y) continue;
    counts.set(y, (counts.get(y) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort();
  for (const [y, n] of sorted) {
    console.log(`${y}  ${n}`);
  }
}

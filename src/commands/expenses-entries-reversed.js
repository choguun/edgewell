// `edgewell expenses-entries-reversed` lists the expenses
// in reverse chronological order.

import { c } from "../cli.js";

export async function expensesEntriesReversedCommand(args, ew) {
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const sorted = all.slice().sort((a, b) => (b._ts ?? "").localeCompare(a._ts ?? ""));
  for (const e of sorted) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

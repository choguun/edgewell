// `edgewell expenses-entries-first` prints the first expense.
// Sibling to `journal-entries-first`.

import { c } from "../cli.js";

export async function expensesEntriesFirstCommand(_args, ew) {
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const e = all[0];
  console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
}

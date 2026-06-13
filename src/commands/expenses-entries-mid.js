// `edgewell expenses-entries-mid` prints the median expense.
// Sibling to `journal-entries-mid`.

import { c } from "../cli.js";

export async function expensesEntriesMidCommand(_args, ew) {
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const e = all[Math.floor(all.length / 2)];
  console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
}

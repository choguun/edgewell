// `edgewell expenses-entries-last` prints the last expense.
// Sibling to `journal-entries-last`.

import { c } from "../cli.js";

export async function expensesEntriesLastCommand(_args, ew) {
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const e = all[all.length - 1];
  console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
}

// `edgewell expenses-entries-even` lists the even-indexed
// expenses. Sibling to `journal-entries-even`.

import { c } from "../cli.js";

export async function expensesEntriesEvenCommand(_args, ew) {
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  for (let i = 0; i < all.length; i += 2) {
    const e = all[i];
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

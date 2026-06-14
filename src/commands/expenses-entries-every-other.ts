// @ts-nocheck
// `edgewell expenses-entries-every-other` lists every other
// expense. Sibling to `journal-entries-every-other`.

import { c } from "../cli.js";

export async function expensesEntriesEveryOtherCommand(_args, ew) {
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

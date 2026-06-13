// `edgewell expenses-entries-odd` lists the odd-indexed
// expenses. Sibling to `journal-entries-odd`.

import { c } from "../cli.js";

export async function expensesEntriesOddCommand(_args, ew) {
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  for (let i = 1; i < all.length; i += 2) {
    const e = all[i];
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

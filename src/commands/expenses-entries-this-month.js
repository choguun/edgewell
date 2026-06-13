// `edgewell expenses-entries-this-month` lists the expenses
// for the current calendar month. Sibling to
// `journal-entries-this-month`.

import { c } from "../cli.js";

export async function expensesEntriesThisMonthCommand(_args, ew) {
  const month = new Date().toISOString().slice(0, 7);
  const all = await ew.expenses.readAll();
  const matches = all.filter((e) => (e._ts ?? "").startsWith(month));
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses in ${month})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

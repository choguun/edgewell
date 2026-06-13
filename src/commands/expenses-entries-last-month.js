// `edgewell expenses-entries-last-month` lists the expenses
// for the previous calendar month. Sibling to
// `journal-entries-last-month`.

import { c } from "../cli.js";

function previousMonth() {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 7);
}

export async function expensesEntriesLastMonthCommand(_args, ew) {
  const month = previousMonth();
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

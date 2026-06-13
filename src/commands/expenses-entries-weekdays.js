// `edgewell expenses-entries-weekdays` lists the expenses
// logged on weekdays (Mon-Fri).

import { c } from "../cli.js";

export async function expensesEntriesWeekdaysCommand(_args, ew) {
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const matches = all.filter((e) => {
    const d = new Date(e._ts).getUTCDay();
    return d >= 1 && d <= 5;
  });
  if (matches.length === 0) {
    console.log(c.dim("(no weekday expenses)"));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

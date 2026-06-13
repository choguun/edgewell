// `edgewell expenses-entries-last-180-days` lists the expenses
// logged in the last 180 days.

import { c } from "../cli.js";

export async function expensesEntriesLast180DaysCommand(_args, ew) {
  const since = Date.now() - 180 * 86400_000;
  const all = await ew.expenses.readAll();
  const matches = all.filter((e) => new Date(e._ts).getTime() >= since);
  if (matches.length === 0) {
    console.log(c.dim("(no expenses in the last 180 days)"));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

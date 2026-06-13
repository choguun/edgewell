// `edgewell expenses-entries-last-week` lists the expenses
// logged in the last 7 days. v3.0.0 keeps the filter in JS.

import { c } from "../cli.js";

export async function expensesEntriesLastWeekCommand(_args, ew) {
  const since = Date.now() - 7 * 86400_000;
  const all = await ew.expenses.readAll();
  const matches = all.filter((e) => new Date(e._ts).getTime() >= since);
  if (matches.length === 0) {
    console.log(c.dim("(no expenses in the last 7 days)"));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

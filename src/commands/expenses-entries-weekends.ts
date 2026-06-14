// @ts-nocheck
// `edgewell expenses-entries-weekends` lists the expenses
// logged on weekends.

import { c } from "../cli.js";

export async function expensesEntriesWeekendsCommand(_args, ew) {
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const matches = all.filter((e) => {
    const d = new Date(e._ts).getUTCDay();
    return d === 0 || d === 6;
  });
  if (matches.length === 0) {
    console.log(c.dim("(no weekend expenses)"));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

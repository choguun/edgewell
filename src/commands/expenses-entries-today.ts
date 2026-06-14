// @ts-nocheck
// `edgewell expenses-entries-today` lists the expenses for
// today's date.

import { c } from "../cli.js";

export async function expensesEntriesTodayCommand(_args, ew) {
  const day = new Date().toISOString().slice(0, 10);
  const all = await ew.expenses.readAll();
  const matches = all.filter((e) => (e._ts ?? "").startsWith(day));
  if (matches.length === 0) {
    console.log(c.dim("(no expenses today)"));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

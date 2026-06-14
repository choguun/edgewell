// @ts-nocheck
// `edgewell expenses-entries-this-year` lists the expenses
// for the current calendar year.

import { c } from "../cli.js";

export async function expensesEntriesThisYearCommand(_args, ew) {
  const year = new Date().toISOString().slice(0, 4);
  const all = await ew.expenses.readAll();
  const matches = all.filter((e) => (e._ts ?? "").startsWith(year));
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses in ${year})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

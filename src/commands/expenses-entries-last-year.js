// `edgewell expenses-entries-last-year` lists the expenses
// for the previous calendar year.

import { c } from "../cli.js";

function previousYear() {
  return String(new Date().getUTCFullYear() - 1);
}

export async function expensesEntriesLastYearCommand(_args, ew) {
  const year = previousYear();
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

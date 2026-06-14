// @ts-nocheck
// `edgewell expenses-entries-year-N <YYYY>` lists the expenses
// logged in a specific year.

import { c } from "../cli.js";

export async function expensesEntriesYearNCommand(args, ew) {
  const year = String(args[0] ?? "");
  if (!/^\d{4}$/.test(year)) {
    console.error("usage: edgewell expenses-entries-year-N <YYYY>");
    process.exit(2);
  }
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const matches = all.filter((e) => (e._ts ?? "").startsWith(year));
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses in ${year})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

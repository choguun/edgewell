// @ts-nocheck
// `edgewell expenses-entries-month-N <N>` lists the expenses
// logged in the Nth month of any year. Sibling to
// `journal-entries-month-N`.

import { c } from "../cli.js";

export async function expensesEntriesMonthNCommand(args, ew) {
  const m = Number(args[0]);
  if (!Number.isFinite(m) || m < 1 || m > 12) {
    console.error("usage: edgewell expenses-entries-month-N <1..12>");
    process.exit(2);
  }
  const month = String(m).padStart(2, "0");
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const matches = all.filter((e) => (e._ts ?? "").slice(5, 7) === month);
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses in month ${m})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

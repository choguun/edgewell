// @ts-nocheck
// `edgewell expenses-entries-this-year-month <MM>` lists the
// expenses for a specific month of the current year.

import { c } from "../cli.js";

export async function expensesEntriesThisYearMonthCommand(args, ew) {
  const month = String(args[0] ?? "").padStart(2, "0");
  if (!/^\d{2}$/.test(month)) {
    console.error("usage: edgewell expenses-entries-this-year-month <MM>");
    process.exit(2);
  }
  const year = new Date().getUTCFullYear();
  const prefix = `${year}-${month}`;
  const all = await ew.expenses.readAll();
  const matches = all.filter((e) => (e._ts ?? "").startsWith(prefix));
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses in ${prefix})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

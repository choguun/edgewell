// `edgewell expenses-entries-year-month <YYYY-MM>` lists the
// expenses for a specific year-month.

import { c } from "../cli.js";

export async function expensesEntriesYearMonthCommand(args, ew) {
  const ym = String(args[0] ?? "");
  if (!/^\d{4}-\d{2}$/.test(ym)) {
    console.error("usage: edgewell expenses-entries-year-month <YYYY-MM>");
    process.exit(2);
  }
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const matches = all.filter((e) => (e._ts ?? "").slice(0, 7) === ym);
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses in ${ym})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

// `edgewell expenses-entries-day-of-month <N>` lists the
// expenses logged on the Nth day of the month. v3.0.0 keeps
// the filter in JS.

import { c } from "../cli.js";

export async function expensesEntriesDayOfMonthCommand(args, ew) {
  const day = Number(args[0]);
  if (!Number.isFinite(day) || day < 1 || day > 31) {
    console.error("usage: edgewell expenses-entries-day-of-month <1..31>");
    process.exit(2);
  }
  const dayStr = String(day).padStart(2, "0");
  const all = await ew.expenses.readAll();
  const matches = all.filter((e) => (e._ts ?? "").slice(8, 10) === dayStr);
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses on day ${day} of any month)`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

// @ts-nocheck
// `edgewell expenses-entries-weekday-N <N>` lists the expenses
// logged on the Nth weekday. Sibling to
// `journal-entries-weekday-N`.

import { c } from "../cli.js";

const NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function expensesEntriesWeekdayNCommand(args, ew) {
  const d = Number(args[0]);
  if (!Number.isFinite(d) || d < 0 || d > 6) {
    console.error("usage: edgewell expenses-entries-weekday-N <0..6>");
    process.exit(2);
  }
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const matches = all.filter((e) => new Date(e._ts).getUTCDay() === d);
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses on ${NAMES[d]})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

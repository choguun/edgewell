// @ts-nocheck
// `edgewell expenses-entries-hour-N <N>` lists the expenses
// logged in the Nth hour of the day. Sibling to
// `journal-entries-hour-N`.

import { c } from "../cli.js";

export async function expensesEntriesHourNCommand(args, ew) {
  const h = Number(args[0]);
  if (!Number.isFinite(h) || h < 0 || h > 23) {
    console.error("usage: edgewell expenses-entries-hour-N <0..23>");
    process.exit(2);
  }
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const matches = all.filter((e) => new Date(e._ts).getUTCHours() === h);
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses in hour ${h})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

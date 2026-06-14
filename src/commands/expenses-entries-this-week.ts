// @ts-nocheck
// `edgewell expenses-entries-this-week` lists the expenses
// for the current ISO week.

import { c } from "../cli.js";

function startOfWeek(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
}

export async function expensesEntriesThisWeekCommand(_args, ew) {
  const start = startOfWeek(new Date()).toISOString();
  const all = await ew.expenses.readAll();
  const matches = all.filter((e) => e._ts >= start);
  if (matches.length === 0) {
    console.log(c.dim("(no expenses this week)"));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

// @ts-nocheck
// `edgewell expenses-entries-yesterday` lists the expenses
// for yesterday.

import { c } from "../cli.js";

function yesterdayIso() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function expensesEntriesYesterdayCommand(_args, ew) {
  const day = yesterdayIso();
  const all = await ew.expenses.readAll();
  const matches = all.filter((e) => (e._ts ?? "").startsWith(day));
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses on ${day})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

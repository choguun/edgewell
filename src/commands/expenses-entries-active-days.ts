// @ts-nocheck
// `edgewell expenses-entries-active-days` reports the number
// of distinct days with at least one expense. Sibling to
// `journal-entries-active-days`.

import { c } from "../cli.js";

function dayKey(ts) {
  return (ts ?? "").slice(0, 10);
}

export async function expensesEntriesActiveDaysCommand(_args, ew) {
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(0);
    return;
  }
  const days = new Set(all.map((e) => dayKey(e._ts)));
  console.log(days.size);
}

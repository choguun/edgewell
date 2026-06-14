// @ts-nocheck
// `edgewell expenses-entries-decile <N>` lists the expenses
// in the Nth decile. Sibling to `journal-entries-decile`.

import { c } from "../cli.js";

export async function expensesEntriesDecileCommand(args, ew) {
  const d = Number(args[0]);
  if (!Number.isFinite(d) || d < 1 || d > 10) {
    console.error("usage: edgewell expenses-entries-decile <1..10>");
    process.exit(2);
  }
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const start = Math.floor((d - 1) * all.length / 10);
  const end = Math.floor(d * all.length / 10);
  for (let i = start; i < end; i++) {
    const e = all[i];
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

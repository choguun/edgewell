// @ts-nocheck
// `edgewell expenses-entries-quartile <N>` lists the expenses
// in the Nth quartile. Sibling to `journal-entries-quartile`.

import { c } from "../cli.js";

export async function expensesEntriesQuartileCommand(args, ew) {
  const q = Number(args[0]);
  if (!Number.isFinite(q) || q < 1 || q > 4) {
    console.error("usage: edgewell expenses-entries-quartile <1..4>");
    process.exit(2);
  }
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const start = Math.floor((q - 1) * all.length / 4);
  const end = Math.floor(q * all.length / 4);
  for (let i = start; i < end; i++) {
    const e = all[i];
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

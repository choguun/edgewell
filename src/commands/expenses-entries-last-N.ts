// @ts-nocheck
// `edgewell expenses-entries-last-N <N>` lists the last N
// expenses.

import { c } from "../cli.js";

export async function expensesEntriesLastNCommand(args, ew) {
  const n = Number(args[0] ?? 5);
  if (!Number.isFinite(n) || n <= 0) {
    console.error("usage: edgewell expenses-entries-last-N <N>");
    process.exit(2);
  }
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const slice = all.slice(-n);
  for (const e of slice) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

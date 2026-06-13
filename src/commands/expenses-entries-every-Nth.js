// `edgewell expenses-entries-every-Nth <N>` lists every Nth
// expense. Sibling to `journal-entries-every-Nth`.

import { c } from "../cli.js";

export async function expensesEntriesEveryNthCommand(args, ew) {
  const n = Number(args[0]);
  if (!Number.isFinite(n) || n < 1) {
    console.error("usage: edgewell expenses-entries-every-Nth <N>");
    process.exit(2);
  }
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  for (let i = 0; i < all.length; i += n) {
    const e = all[i];
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

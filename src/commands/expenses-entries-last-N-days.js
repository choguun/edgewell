// `edgewell expenses-entries-last-N-days <N>` lists the
// expenses logged in the last N days.

import { c } from "../cli.js";

export async function expensesEntriesLastNDaysCommand(args, ew) {
  const n = Number(args[0]);
  if (!Number.isFinite(n) || n <= 0) {
    console.error("usage: edgewell expenses-entries-last-N-days <N>");
    process.exit(2);
  }
  const since = Date.now() - n * 86400_000;
  const all = await ew.expenses.readAll();
  const matches = all.filter((e) => new Date(e._ts).getTime() >= since);
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses in the last ${n} days)`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

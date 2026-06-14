// @ts-nocheck
// `edgewell expenses-entries-last-N-weeks <N>` lists the
// expenses from the last N weeks.

import { c } from "../cli.js";

export async function expensesEntriesLastNWeeksCommand(args, ew) {
  const N = Number(args[0]);
  if (!Number.isFinite(N) || N < 1) {
    console.error("usage: edgewell expenses-entries-last-N-weeks <N>");
    process.exit(2);
  }
  const cutoffMs = Date.now() - N * 7 * 86400_000;
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const matches = all.filter((e) => {
    const t = new Date(e._ts).getTime();
    return t >= cutoffMs;
  });
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses in the last ${N} weeks)`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

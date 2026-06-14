// @ts-nocheck
// `edgewell expenses-entries-yesterday-N <N>` lists the
// expenses from yesterday, but N more days back.

import { c } from "../cli.js";

export async function expensesEntriesYesterdayNCommand(args, ew) {
  const extra = Number(args[0]);
  if (!Number.isFinite(extra) || extra < 0) {
    console.error("usage: edgewell expenses-entries-yesterday-N <extra-days-back>");
    process.exit(2);
  }
  const targetMs = Date.now() - (extra + 1) * 86400_000;
  const targetDay = new Date(targetMs).toISOString().slice(0, 10);
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const matches = all.filter((e) => (e._ts ?? "").slice(0, 10) === targetDay);
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses on ${targetDay})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

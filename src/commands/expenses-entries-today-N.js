// `edgewell expenses-entries-today-N <days-ago>` lists the
// expenses from N days ago.

import { c } from "../cli.js";

export async function expensesEntriesTodayNCommand(args, ew) {
  const daysAgo = Number(args[0]);
  if (!Number.isFinite(daysAgo) || daysAgo < 0) {
    console.error("usage: edgewell expenses-entries-today-N <days-ago>");
    process.exit(2);
  }
  const targetMs = Date.now() - daysAgo * 86400_000;
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

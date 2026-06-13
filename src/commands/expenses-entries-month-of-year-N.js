// `edgewell expenses-entries-month-of-year-N <1..12> <N>`
// lists the Nth occurrence of a specific month-of-year.

import { c } from "../cli.js";

export async function expensesEntriesMonthOfYearNCommand(args, ew) {
  const m = Number(args[0]);
  const N = Number(args[1]);
  if (!Number.isFinite(m) || m < 1 || m > 12 || !Number.isFinite(N) || N < 1) {
    console.error("usage: edgewell expenses-entries-month-of-year-N <1..12> <N>");
    process.exit(2);
  }
  const month = String(m).padStart(2, "0");
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const groups = new Map();
  for (const e of all) {
    const ym = (e._ts ?? "").slice(0, 7);
    if (ym.slice(5, 7) !== month) continue;
    if (!groups.has(ym)) groups.set(ym, []);
    groups.get(ym).push(e);
  }
  const picks = [];
  for (const [ym, arr] of [...groups.entries()].sort()) {
    arr.sort((a, b) => (a._ts ?? "").localeCompare(b._ts ?? ""));
    if (arr[N - 1]) picks.push(arr[N - 1]);
  }
  if (picks.length === 0) {
    console.log(c.dim(`(no ${N}th expense in month-of-year ${m} found)`));
    return;
  }
  for (const e of picks) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

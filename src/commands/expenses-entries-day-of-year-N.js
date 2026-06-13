// `edgewell expenses-entries-day-of-year-N <1..366> <N>`
// lists the Nth occurrence of a specific day-of-year.

import { c } from "../cli.js";

function dayOfYear(d) {
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.floor((d - start) / 86400_000) + 1;
}

export async function expensesEntriesDayOfYearNCommand(args, ew) {
  const doy = Number(args[0]);
  const N = Number(args[1]);
  if (!Number.isFinite(doy) || doy < 1 || doy > 366 || !Number.isFinite(N) || N < 1) {
    console.error("usage: edgewell expenses-entries-day-of-year-N <1..366> <N>");
    process.exit(2);
  }
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const byYear = new Map();
  for (const e of all) {
    const d = new Date(e._ts);
    if (Number.isNaN(d.getTime())) continue;
    if (dayOfYear(d) !== doy) continue;
    const y = d.getUTCFullYear();
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y).push(e);
  }
  const picks = [];
  for (const [y, arr] of [...byYear.entries()].sort((a, b) => a[0] - b[0])) {
    arr.sort((a, b) => (a._ts ?? "").localeCompare(b._ts ?? ""));
    if (arr[N - 1]) picks.push(arr[N - 1]);
  }
  if (picks.length === 0) {
    console.log(c.dim(`(no ${N}th day-of-year ${doy} found)`));
    return;
  }
  for (const e of picks) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

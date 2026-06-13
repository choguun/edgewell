// `edgewell expenses-entries-day-of-year <day-of-year>` lists
// the expenses for a specific day of the year across all
// years.

import { c } from "../cli.js";

export async function expensesEntriesDayOfYearCommand(args, ew) {
  const doy = Number(args[0]);
  if (!Number.isFinite(doy) || doy < 1 || doy > 366) {
    console.error("usage: edgewell expenses-entries-day-of-year <1..366>");
    process.exit(2);
  }
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const matches = all.filter((e) => {
    const d = new Date(e._ts);
    if (Number.isNaN(d.getTime())) return false;
    const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const day = Math.floor((d - start) / 86400_000) + 1;
    return day === doy;
  });
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses on day-of-year ${doy})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

// `edgewell expenses-entries-quarter-of-year <1..4>` lists
// the expenses for a specific quarter of the year across all
// years.

import { c } from "../cli.js";

function quarterOfMonth(monthIdx0) {
  return Math.floor(monthIdx0 / 3) + 1; // 1..4
}

export async function expensesEntriesQuarterOfYearCommand(args, ew) {
  const q = Number(args[0]);
  if (!Number.isFinite(q) || q < 1 || q > 4) {
    console.error("usage: edgewell expenses-entries-quarter-of-year <1..4>");
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
    return quarterOfMonth(d.getUTCMonth()) === q;
  });
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses in quarter ${q})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

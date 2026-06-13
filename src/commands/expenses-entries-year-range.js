// `edgewell expenses-entries-year-range <start> <end>` lists
// the expenses in the inclusive year range [start, end].

import { c } from "../cli.js";

export async function expensesEntriesYearRangeCommand(args, ew) {
  const start = String(args[0] ?? "");
  const end = String(args[1] ?? "");
  if (!/^\d{4}$/.test(start) || !/^\d{4}$/.test(end) || start > end) {
    console.error("usage: edgewell expenses-entries-year-range <start-YYYY> <end-YYYY>");
    process.exit(2);
  }
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const matches = all.filter((e) => {
    const y = (e._ts ?? "").slice(0, 4);
    return y >= start && y <= end;
  });
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses in ${start}..${end})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

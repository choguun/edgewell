// `edgewell expenses-entries-quarter <YYYY-QN>` lists the
// expenses for a specific quarter.

import { c } from "../cli.js";

export async function expensesEntriesQuarterCommand(args, ew) {
  const q = args[0];
  if (!q || !/^\d{4}-Q[1-4]$/.test(q)) {
    console.error("usage: edgewell expenses-entries-quarter <YYYY-QN>");
    process.exit(2);
  }
  const [yearStr, qStr] = q.split("-Q");
  const year = Number(yearStr);
  const qNum = Number(qStr);
  const startMonth = (qNum - 1) * 3 + 1;
  const start = `${year}-${String(startMonth).padStart(2, "0")}-01`;
  const endMonth = startMonth + 3;
  const end = `${endMonth > 12 ? year + 1 : year}-${String(endMonth > 12 ? endMonth - 12 : endMonth).padStart(2, "0")}-01`;
  const all = await ew.expenses.readAll();
  const matches = all.filter((e) => (e._ts ?? "").slice(0, 10) >= start && (e._ts ?? "").slice(0, 10) < end);
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses in ${q})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

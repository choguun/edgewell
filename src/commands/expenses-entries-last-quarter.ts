// @ts-nocheck
// `edgewell expenses-entries-last-quarter` lists the expenses
// for the previous quarter.

import { c } from "../cli.js";

function previousQuarter() {
  const now = new Date();
  const m = now.getUTCMonth() + 1;
  const q = Math.ceil(m / 3);
  if (q === 1) {
    return { year: now.getUTCFullYear() - 1, q: 4 };
  }
  return { year: now.getUTCFullYear(), q: q - 1 };
}

export async function expensesEntriesLastQuarterCommand(_args, ew) {
  const { year, q } = previousQuarter();
  const startMonth = (q - 1) * 3 + 1;
  const start = `${year}-${String(startMonth).padStart(2, "0")}-01`;
  const endMonth = startMonth + 3;
  const end = `${endMonth > 12 ? year + 1 : year}-${String(endMonth > 12 ? endMonth - 12 : endMonth).padStart(2, "0")}-01`;
  const all = await ew.expenses.readAll();
  const matches = all.filter((e) => (e._ts ?? "").slice(0, 10) >= start && (e._ts ?? "").slice(0, 10) < end);
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses in Q${q} ${year})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

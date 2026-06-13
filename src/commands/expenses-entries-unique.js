// `edgewell expenses-entries-unique` lists the expenses
// with duplicate categories removed (keeps first occurrence).

import { c } from "../cli.js";

export async function expensesEntriesUniqueCommand(args, ew) {
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const seen = new Set();
  const unique = [];
  for (const e of all) {
    const c2 = String(e.category ?? "");
    if (seen.has(c2)) continue;
    seen.add(c2);
    unique.push(e);
  }
  if (unique.length === 0) {
    console.log(c.dim("(no unique expenses)"));
    return;
  }
  for (const e of unique) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

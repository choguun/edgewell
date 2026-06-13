// `edgewell expenses-entries-duplicates` lists the expenses
// whose category appears more than once.

import { c } from "../cli.js";

export async function expensesEntriesDuplicatesCommand(args, ew) {
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const counts = new Map();
  for (const e of all) {
    const c2 = String(e.category ?? "");
    counts.set(c2, (counts.get(c2) ?? 0) + 1);
  }
  const dupes = all.filter((e) => (counts.get(String(e.category ?? "")) ?? 0) > 1);
  if (dupes.length === 0) {
    console.log(c.dim("(no duplicate category expenses)"));
    return;
  }
  for (const e of dupes) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

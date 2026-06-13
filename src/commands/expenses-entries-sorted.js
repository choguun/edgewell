// `edgewell expenses-entries-sorted [asc|desc]` lists the
// expenses sorted by category.

import { c } from "../cli.js";

export async function expensesEntriesSortedCommand(args, ew) {
  const order = String(args[0] ?? "asc");
  if (!["asc", "desc"].includes(order)) {
    console.error("usage: edgewell expenses-entries-sorted [asc|desc]");
    process.exit(2);
  }
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const sorted = all.slice().sort((a, b) => {
    const cmp = String(a.category ?? "").localeCompare(String(b.category ?? ""));
    return order === "asc" ? cmp : -cmp;
  });
  for (const e of sorted) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

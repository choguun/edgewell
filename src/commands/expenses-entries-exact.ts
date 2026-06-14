// @ts-nocheck
// `edgewell expenses-entries-exact <category>` lists the
// expenses whose category exactly matches.

import { c } from "../cli.js";

export async function expensesEntriesExactCommand(args, ew) {
  const cat = String(args[0] ?? "");
  if (!cat) {
    console.error("usage: edgewell expenses-entries-exact <category>");
    process.exit(2);
  }
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const matches = all.filter((e) => String(e.category ?? "") === cat);
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses exactly equal to "${cat}")`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

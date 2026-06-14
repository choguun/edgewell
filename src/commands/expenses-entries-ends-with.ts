// @ts-nocheck
// `edgewell expenses-entries-ends-with <suffix>` lists the
// expenses whose category ends with a suffix.

import { c } from "../cli.js";

export async function expensesEntriesEndsWithCommand(args, ew) {
  const suffix = String(args[0] ?? "");
  if (!suffix) {
    console.error("usage: edgewell expenses-entries-ends-with <suffix>");
    process.exit(2);
  }
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const lower = suffix.toLowerCase();
  const matches = all.filter((e) => String(e.category ?? "").toLowerCase().endsWith(lower));
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses with category ending with "${suffix}")`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

// `edgewell expenses-entries-starts-with <prefix>` lists the
// expenses whose category starts with a prefix.

import { c } from "../cli.js";

export async function expensesEntriesStartsWithCommand(args, ew) {
  const prefix = String(args[0] ?? "");
  if (!prefix) {
    console.error("usage: edgewell expenses-entries-starts-with <prefix>");
    process.exit(2);
  }
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const lower = prefix.toLowerCase();
  const matches = all.filter((e) => String(e.category ?? "").toLowerCase().startsWith(lower));
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses with category starting with "${prefix}")`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

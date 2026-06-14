// @ts-nocheck
// `edgewell expenses-entries-contains <substring>` lists the
// expenses whose category or memo contains a substring.

import { c } from "../cli.js";

export async function expensesEntriesContainsCommand(args, ew) {
  const needle = String(args[0] ?? "");
  if (!needle) {
    console.error("usage: edgewell expenses-entries-contains <substring>");
    process.exit(2);
  }
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const lower = needle.toLowerCase();
  const matches = all.filter((e) => {
    const hay = `${e.category ?? ""} ${e.memo ?? ""} ${e.note ?? ""}`.toLowerCase();
    return hay.includes(lower);
  });
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses containing "${needle}")`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

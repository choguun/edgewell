// `edgewell expenses-find <category>` lists expenses in a given
// category. Useful for browsing a slice of the expense log.

import { c } from "../cli.js";

export async function expensesFindCommand(args, ew) {
  const cat = args[0];
  if (!cat) {
    console.error("usage: edgewell expenses-find <category>");
    process.exit(2);
  }
  const all = await ew.expenses.readAll();
  const matches = all.filter((e) => e.category === cat);
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses in category "${cat}")`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${c.bold(String(e.amount).padStart(8))} ${e.note ?? ""}`);
  }
}

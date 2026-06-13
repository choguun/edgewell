// `edgewell expenses-day <YYYY-MM-DD>` lists the expenses logged
// on a specific day. v3.0.0 keeps the filter simple — exact
// prefix match on the ISO date.

import { c } from "../cli.js";

export async function expensesDayCommand(args, ew) {
  const day = args[0];
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    console.error("usage: edgewell expenses-day <YYYY-MM-DD>");
    process.exit(2);
  }
  const all = await ew.expenses.readAll();
  const matches = all.filter((e) => (e._ts ?? "").startsWith(day));
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses on ${day})`));
    return;
  }
  let total = 0;
  for (const e of matches) {
    total += Number(e.amount ?? 0);
    console.log(`${c.dim(e._ts)} ${c.bold(String(e.amount).padStart(8))} ${e.category} ${e.note ?? ""}`);
  }
  console.log(c.dim(`total: ${total.toFixed(2)}`));
}

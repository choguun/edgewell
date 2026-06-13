// `edgewell expenses-count` prints the total number of expenses
// plus a per-category breakdown. v3.0.0 keeps this offline.

import { c, header } from "../cli.js";

export async function expensesCountCommand(_args, ew) {
  header("Expenses count");
  const all = await ew.expenses.readAll();
  const byCat = new Map();
  for (const e of all) {
    byCat.set(e.category ?? "other", (byCat.get(e.category ?? "other") ?? 0) + 1);
  }
  console.log(`${c.bold("total:")} ${all.length}`);
  for (const [cat, n] of [...byCat.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c.cyan(cat.padEnd(16))} ${n}`);
  }
}

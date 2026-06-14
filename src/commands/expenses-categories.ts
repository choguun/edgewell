// @ts-nocheck
// `edgewell expenses-categories` lists all distinct expense
// categories ever used. v3.0.0 keeps the aggregation offline.

import { c, header } from "../cli.js";

export async function expensesCategoriesCommand(_args, ew) {
  const all = await ew.expenses.readAll();
  const cats = new Set();
  for (const e of all) cats.add(e.category ?? "other");
  header("Expense categories");
  if (cats.size === 0) {
    console.log(c.dim("(no expenses yet)"));
    return;
  }
  for (const c1 of [...cats].sort()) console.log(`  ${c.cyan(c1)}`);
  console.log(c.dim(`(${cats.size} categories)`));
}

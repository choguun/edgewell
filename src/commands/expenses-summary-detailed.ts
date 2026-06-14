// @ts-nocheck
// `edgewell expenses-summary-detailed` is a multi-line summary
// of the expenses. Sibling to `journal-summary-detailed`.

import { c, header } from "../cli.js";

export async function expensesSummaryDetailedCommand(_args, ew) {
  header("Expenses summary (detailed)");
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const total = all.reduce((s, e) => s + Number(e.amount ?? 0), 0);
  const cats = new Map();
  const days = new Set();
  for (const e of all) {
    cats.set(e.category ?? "other", (cats.get(e.category ?? "other") ?? 0) + Number(e.amount ?? 0));
    days.add((e._ts ?? "").slice(0, 10));
  }
  console.log(`${c.bold("count:")}            ${all.length}`);
  console.log(`${c.bold("total:")}            ${total.toFixed(2)}`);
  console.log(`${c.bold("avg:")}              ${(total / all.length).toFixed(2)}`);
  console.log(`${c.bold("distinct categories:")} ${cats.size}`);
  console.log(`${c.bold("distinct days:")}     ${days.size}`);
  console.log(`${c.bold("first:")}            ${all[0]._ts}`);
  console.log(`${c.bold("last:")}             ${all[all.length - 1]._ts}`);
}

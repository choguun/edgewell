// @ts-nocheck
// `edgewell expenses-stats` reports total spend, top categories,
// and the date range covered.

import { c, header } from "../cli.js";

export async function expensesStatsCommand(_args, ew) {
  header("Expenses statistics");
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses yet)"));
    return;
  }
  const total = all.reduce((s, e) => s + Number(e.amount ?? 0), 0);
  const byCat = new Map();
  for (const e of all) {
    const cat = e.category ?? "other";
    byCat.set(cat, (byCat.get(cat) ?? 0) + Number(e.amount ?? 0));
  }
  console.log(`${c.bold("count:")}    ${all.length}`);
  console.log(`${c.bold("total:")}    ${total.toFixed(2)}`);
  console.log(`${c.bold("avg:")}      ${(total / all.length).toFixed(2)}`);
  console.log(`${c.bold("first:")}    ${all[0]._ts}`);
  console.log(`${c.bold("last:")}     ${all[all.length - 1]._ts}`);
  console.log(c.bold("by category:"));
  for (const [cat, v] of [...byCat.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat.padEnd(16)} ${v.toFixed(2)}`);
  }
}

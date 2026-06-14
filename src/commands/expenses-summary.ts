// @ts-nocheck
// `edgewell expenses-summary` prints a one-paragraph prose
// summary of the expenses. v3.0.0 keeps this offline.

import { c } from "../cli.js";

export async function expensesSummaryCommand(_args, ew) {
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const total = all.reduce((s, e) => s + Number(e.amount ?? 0), 0);
  const byCat = new Map();
  for (const e of all) byCat.set(e.category ?? "other", (byCat.get(e.category ?? "other") ?? 0) + Number(e.amount ?? 0));
  const top = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  console.log(`You have ${all.length} expenses totalling ${total.toFixed(2)}. ` +
    `Top categories: ${top.map(([c, v]) => `${c} ${v.toFixed(2)}`).join(", ")}.`);
}

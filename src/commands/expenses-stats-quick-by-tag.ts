// @ts-nocheck
// `edgewell expenses-stats-quick-by-tag` is the sibling of
// `journal-stats-quick-by-tag` for expenses.

import { c } from "../cli.js";

export async function expensesStatsQuickByTagCommand(_args, ew) {
  const all = await ew.expenses.readAll();
  const totals = new Map();
  for (const e of all) {
    for (const t of e.tags ?? []) {
      totals.set(t, (totals.get(t) ?? 0) + Number(e.amount ?? 0));
    }
  }
  if (totals.size === 0) {
    console.log(c.dim("(no tagged expenses)"));
    return;
  }
  const total = [...totals.values()].reduce((a, b) => a + b, 0);
  console.log(`${c.bold("tags:")} ${totals.size}, ${c.bold("total:")} ${total.toFixed(2)}`);
}

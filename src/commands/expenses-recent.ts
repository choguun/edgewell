// @ts-nocheck
// `edgewell expenses-recent [N]` lists the N most recent
// expenses. v3.0.0 keeps the iteration in JS.

import { c } from "../cli.js";

export async function expensesRecentCommand(args, ew) {
  const n = Number(args[0] ?? 10);
  if (!Number.isFinite(n) || n <= 0) {
    console.error("usage: edgewell expenses-recent [N]");
    process.exit(2);
  }
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const recent = all.slice(-n).reverse();
  for (const e of recent) {
    console.log(`${c.dim(e._ts)} ${c.bold(String(e.amount).padStart(8))} ${e.category} ${e.note ?? ""}`);
  }
}

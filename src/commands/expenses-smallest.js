// `edgewell expenses-smallest [N]` lists the N smallest
// expenses. v3.0.0 keeps the sort in JS.

import { c } from "../cli.js";

export async function expensesSmallestCommand(args, ew) {
  const n = Number(args[0] ?? 5);
  if (!Number.isFinite(n) || n <= 0) {
    console.error("usage: edgewell expenses-smallest [N]");
    process.exit(2);
  }
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const sorted = [...all].sort((a, b) => Number(a.amount ?? 0) - Number(b.amount ?? 0)).slice(0, n);
  for (const e of sorted) {
    console.log(`${c.dim(e._ts)} ${c.bold(String(e.amount).padStart(8))} ${e.category} ${e.note ?? ""}`);
  }
}

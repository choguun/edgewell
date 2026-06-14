// @ts-nocheck
// `edgewell expenses-by-category` prints expenses totals by
// category for a configurable period. v3.0.0 keeps the
// aggregation offline.

import { c, header } from "../cli.js";

export async function expensesByCategoryCommand(args, ew) {
  const days = Number(args[0] ?? 30);
  if (!Number.isFinite(days) || days <= 0) {
    console.error("usage: edgewell expenses-by-category [days]");
    process.exit(2);
  }
  const since = Date.now() - days * 86400_000;
  const all = await ew.expenses.readAll();
  const recent = all.filter((e) => new Date(e._ts).getTime() >= since);
  if (recent.length === 0) {
    console.log(c.dim(`(no expenses in the last ${days} days)`));
    return;
  }
  const byCat = new Map();
  for (const e of recent) {
    const cat = e.category ?? "other";
    byCat.set(cat, (byCat.get(cat) ?? 0) + Number(e.amount ?? 0));
  }
  header(`Expenses by category (last ${days} days)`);
  for (const [cat, v] of [...byCat.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c.cyan(cat.padEnd(16))} ${v.toFixed(2)}`);
  }
}

// `edgewell category-trend <category>` prints the monthly
// total for an expense category. v3.0.0 keeps the aggregation
// offline.

import { c, header } from "../cli.js";

export async function categoryTrendCommand(args, ew) {
  const cat = args[0];
  if (!cat) {
    console.error("usage: edgewell category-trend <category>");
    process.exit(2);
  }
  header(`Category trend: ${cat}`);
  const all = await ew.expenses.readAll();
  const byMonth = new Map();
  for (const e of all) {
    if (e.category === cat) {
      const month = (e._ts ?? "").slice(0, 7);
      byMonth.set(month, (byMonth.get(month) ?? 0) + Number(e.amount ?? 0));
    }
  }
  if (byMonth.size === 0) {
    console.log(c.dim(`(no expenses in category "${cat}")`));
    return;
  }
  for (const [month, v] of [...byMonth.entries()].sort()) {
    const bar = "#".repeat(Math.min(20, Math.round(v / 10)));
    console.log(`  ${month}  ${v.toFixed(2).padStart(8)}  ${bar}`);
  }
}

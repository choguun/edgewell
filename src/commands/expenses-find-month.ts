// @ts-nocheck
// `edgewell expenses-find-month <YYYY-MM>` lists expenses for a
// specific month, grouped by category. Sibling to
// `expenses-find <category>`.

import { c, header } from "../cli.js";

export async function expensesFindMonthCommand(args, ew) {
  const month = args[0];
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    console.error("usage: edgewell expenses-find-month <YYYY-MM>");
    process.exit(2);
  }
  header(`Expenses in ${month}`);
  const all = await ew.expenses.readAll();
  const matches = all.filter((e) => (e._ts ?? "").startsWith(month));
  if (matches.length === 0) {
    console.log(c.dim("(no expenses in this month)"));
    return;
  }
  let total = 0;
  const byCat = new Map();
  for (const e of matches) {
    total += Number(e.amount ?? 0);
    const cat = e.category ?? "other";
    byCat.set(cat, (byCat.get(cat) ?? 0) + Number(e.amount ?? 0));
  }
  for (const [cat, v] of [...byCat.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c.cyan(cat.padEnd(16))} ${v.toFixed(2)}`);
  }
  console.log(c.bold(`total: ${total.toFixed(2)}`));
}

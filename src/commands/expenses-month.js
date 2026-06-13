// `edgewell expenses-month <YYYY-MM>` lists the expenses for a
// specific month. Sibling to `expenses-week` and `expenses-day`.

import { c } from "../cli.js";

export async function expensesMonthCommand(args, ew) {
  const month = args[0];
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    console.error("usage: edgewell expenses-month <YYYY-MM>");
    process.exit(2);
  }
  const all = await ew.expenses.readAll();
  const matches = all.filter((e) => (e._ts ?? "").startsWith(month));
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses in ${month})`));
    return;
  }
  let total = 0;
  for (const e of matches) {
    total += Number(e.amount ?? 0);
    console.log(`${c.dim(e._ts)} ${c.bold(String(e.amount).padStart(8))} ${e.category} ${e.note ?? ""}`);
  }
  console.log(c.dim(`total: ${total.toFixed(2)}`));
}

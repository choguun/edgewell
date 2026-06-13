// `edgewell expenses-week` lists the expenses for the current
// ISO week. Sibling to `journal-week`.

import { c } from "../cli.js";

function startOfWeek(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
}

export async function expensesWeekCommand(_args, ew) {
  const start = startOfWeek(new Date()).toISOString();
  const all = await ew.expenses.readAll();
  const week = all.filter((e) => e._ts >= start);
  if (week.length === 0) {
    console.log(c.dim("(no expenses this week)"));
    return;
  }
  let total = 0;
  for (const e of week) {
    total += Number(e.amount ?? 0);
    console.log(`${c.dim(e._ts)} ${c.bold(String(e.amount).padStart(8))} ${e.category} ${e.note ?? ""}`);
  }
  console.log(c.dim(`total: ${total.toFixed(2)}`));
}

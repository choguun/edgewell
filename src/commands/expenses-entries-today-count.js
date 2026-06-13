// `edgewell expenses-entries-today-count` prints the count
// of expenses for today. Sibling to
// `expenses-entries-today`.

import { c } from "../cli.js";

export async function expensesEntriesTodayCountCommand(_args, ew) {
  const day = new Date().toISOString().slice(0, 10);
  const all = await ew.expenses.readAll();
  const count = all.filter((e) => (e._ts ?? "").startsWith(day)).length;
  console.log(count);
  if (count === 0) console.error(c.dim("(no expenses today)"));
}

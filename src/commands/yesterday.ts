// @ts-nocheck
// `edgewell yesterday` prints the journal entries and expenses
// from yesterday. Useful for end-of-day reviews.

import { c, header } from "../cli.js";

function isoDay(d) {
  return d.toISOString().slice(0, 10);
}

function yesterdayIso() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return isoDay(d);
}

export async function yesterdayCommand(_args, ew) {
  const day = yesterdayIso();
  header(`Yesterday: ${day}`);
  const journal = (await ew.journal.readAll()).filter((e) => (e._ts ?? "").startsWith(day));
  const expenses = (await ew.expenses.readAll()).filter((e) => (e._ts ?? "").startsWith(day));
  console.log(c.bold("Journal:"));
  if (journal.length === 0) console.log(c.dim("  (none)"));
  for (const e of journal) console.log(`  ${e.text}`);
  const total = expenses.reduce((s, e) => s + Number(e.amount ?? 0), 0);
  console.log(c.bold(`Expenses: ${expenses.length} entries, total ${total.toFixed(2)}`));
}

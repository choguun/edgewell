// @ts-nocheck
// `edgewell today` prints the journal entries and expenses logged
// for today's date in the local timezone.

import { c, header } from "../cli.js";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export async function todayCommand(_args, ew) {
  const day = todayIso();
  header(`Today: ${day}`);
  const journal = (await ew.journal.readAll()).filter((e) => (e._ts ?? "").startsWith(day));
  const expenses = (await ew.expenses.readAll()).filter((e) => (e._ts ?? "").startsWith(day));
  console.log(c.bold("Journal:"));
  if (journal.length === 0) console.log(c.dim("  (none)"));
  for (const e of journal) console.log(`  ${e.text}`);
  const total = expenses.reduce((s, e) => s + Number(e.amount ?? 0), 0);
  console.log(c.bold(`Expenses: ${expenses.length} entries, total ${total.toFixed(2)}`));
}

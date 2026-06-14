// @ts-nocheck
// `edgewell monthly-review` summarises the current month: journal
// entries, expenses, and per-tag totals. Sibling to the
// `weekly-review` command.

import { c, header } from "../cli.js";

const month = () => new Date().toISOString().slice(0, 7);

export async function monthlyReviewCommand(_args, ew) {
  const m = month();
  const journal = (await ew.journal.readAll()).filter((e) => (e._ts ?? "").startsWith(m));
  const expenses = (await ew.expenses.readAll()).filter((e) => (e._ts ?? "").startsWith(m));
  const total = expenses.reduce((s, e) => s + Number(e.amount ?? 0), 0);
  header(`Monthly review: ${m}`);
  console.log(`${c.bold("journal entries:")} ${journal.length}`);
  console.log(`${c.bold("expenses:")} ${expenses.length} (total ${total.toFixed(2)})`);
  const tags = new Map();
  for (const e of journal) for (const t of e.tags ?? []) tags.set(t, (tags.get(t) ?? 0) + 1);
  if (tags.size > 0) {
    console.log(c.dim("top tags:"));
    for (const [t, n] of [...tags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
      console.log(`  ${t.padEnd(16)} ${n}`);
    }
  }
}

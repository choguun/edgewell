// `edgewell month-summary <YYYY-MM>` prints a one-paragraph
// summary of a specific month. v3.0.0 keeps the aggregation
// offline.

import { c, header } from "../cli.js";

export async function monthSummaryCommand(args, ew) {
  const month = args[0];
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    console.error("usage: edgewell month-summary <YYYY-MM>");
    process.exit(2);
  }
  header(`Month summary: ${month}`);
  const journal = (await ew.journal.readAll()).filter((e) => (e._ts ?? "").startsWith(month));
  const expenses = (await ew.expenses.readAll()).filter((e) => (e._ts ?? "").startsWith(month));
  const total = expenses.reduce((s, e) => s + Number(e.amount ?? 0), 0);
  const tags = new Map();
  for (const e of journal) for (const t of e.tags ?? []) tags.set(t, (tags.get(t) ?? 0) + 1);
  console.log(`${c.bold("journal:")} ${journal.length} entries`);
  console.log(`${c.bold("expenses:")} ${expenses.length} (total ${total.toFixed(2)})`);
  if (tags.size > 0) {
    console.log(c.dim("top tags:"));
    for (const [t, n] of [...tags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
      console.log(`  ${t.padEnd(16)} ${n}`);
    }
  }
}

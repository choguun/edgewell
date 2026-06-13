// `edgewell weekly-review` summarises the last 7 days: journal
// entries, expenses, and a "did you..." checklist. v3.0.0 keeps
// the aggregation offline.

import { c, header } from "../cli.js";

function withinLastWeek(ts) {
  const t = new Date(ts).getTime();
  return t >= Date.now() - 7 * 86400_000;
}

export async function weeklyReviewCommand(_args, ew) {
  const weekAgo = Date.now() - 7 * 86400_000;
  const journal = (await ew.journal.readAll()).filter((e) => new Date(e._ts).getTime() >= weekAgo);
  const expenses = (await ew.expenses.readAll()).filter((e) => new Date(e._ts).getTime() >= weekAgo);
  const total = expenses.reduce((s, e) => s + Number(e.amount ?? 0), 0);
  header("Weekly review");
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

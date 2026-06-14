// @ts-nocheck
// `edgewell expenses-entries-this-week-N <N>` lists the
// expenses from the Nth day of the current ISO week.

import { c } from "../cli.js";

function isoDayOfWeek(d) {
  const js = d.getUTCDay();
  return (js + 6) % 7;
}

export async function expensesEntriesThisWeekNCommand(args, ew) {
  const dayIdx = Number(args[0]);
  if (!Number.isFinite(dayIdx) || dayIdx < 0 || dayIdx > 6) {
    console.error("usage: edgewell expenses-entries-this-week-N <0..6>");
    process.exit(2);
  }
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setUTCDate(now.getUTCDate() - isoDayOfWeek(now));
  startOfWeek.setUTCHours(0, 0, 0, 0);
  const targetMs = startOfWeek.getTime() + dayIdx * 86400_000;
  const targetDay = new Date(targetMs).toISOString().slice(0, 10);
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const matches = all.filter((e) => (e._ts ?? "").slice(0, 10) === targetDay);
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses on ${targetDay})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

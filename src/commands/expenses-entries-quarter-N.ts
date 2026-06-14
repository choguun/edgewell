// @ts-nocheck
// `edgewell expenses-entries-quarter-N <N>` lists the
// expenses in the Nth week of the current quarter.

import { c } from "../cli.js";

function quarterStart(monthIdx0) {
  return monthIdx0 - (monthIdx0 % 3) + 1;
}

function quarterStartMs(year, monthIdx0) {
  return Date.UTC(year, monthIdx0 - 1, 1);
}

function quarterEndMs(year, monthIdx0) {
  return Date.UTC(year, monthIdx0 + 1, 1);
}

export async function expensesEntriesQuarterNCommand(args, ew) {
  const qw = Number(args[0]);
  if (!Number.isFinite(qw) || qw < 1 || qw > 13) {
    console.error("usage: edgewell expenses-entries-quarter-N <1..13>");
    process.exit(2);
  }
  const now = new Date();
  const year = now.getUTCFullYear();
  const qMonth = quarterStart(now.getUTCMonth());
  const startMs = quarterStartMs(year, qMonth);
  const endMs = quarterEndMs(year, qMonth);
  const targetMs = startMs + (qw - 1) * 7 * 86400_000;
  const targetDay = new Date(Math.min(targetMs, endMs - 1)).toISOString().slice(0, 10);
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

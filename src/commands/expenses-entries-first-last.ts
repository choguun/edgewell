// @ts-nocheck
// `edgewell expenses-entries-first-last` lists the first
// and last expenses chronologically.

import { c } from "../cli.js";

export async function expensesEntriesFirstLastCommand(args, ew) {
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const sorted = all.slice().sort((a, b) => (a._ts ?? "").localeCompare(b._ts ?? ""));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  console.log(c.dim("first:"));
  console.log(`${c.dim(first._ts)} ${first.category} ${first.amount}`);
  console.log(c.dim("last:"));
  console.log(`${c.dim(last._ts)} ${last.category} ${last.amount}`);
}

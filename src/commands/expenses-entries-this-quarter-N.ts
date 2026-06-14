// @ts-nocheck
// `edgewell expenses-entries-this-quarter-N <day-of-month>`
// lists the expenses for the Nth day of the current quarter.

import { c } from "../cli.js";

function quarterStart(monthIdx0) {
  return monthIdx0 - (monthIdx0 % 3) + 1;
}

function quarterEndMonth(monthIdx0) {
  return quarterStart(monthIdx0) + 2;
}

export async function expensesEntriesThisQuarterNCommand(args, ew) {
  const day = Number(args[0]);
  if (!Number.isFinite(day) || day < 1 || day > 31) {
    console.error("usage: edgewell expenses-entries-this-quarter-N <day-of-month>");
    process.exit(2);
  }
  const now = new Date();
  const year = now.getUTCFullYear();
  const qStart = quarterStart(now.getUTCMonth());
  const qEnd = quarterEndMonth(now.getUTCMonth());
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const matches = all.filter((e) => {
    const d = new Date(e._ts);
    if (Number.isNaN(d.getTime())) return false;
    if (d.getUTCFullYear() !== year) return false;
    const m = d.getUTCMonth() + 1;
    if (m < qStart || m > qEnd) return false;
    return d.getUTCDate() === day;
  });
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses on day ${day} of Q${Math.ceil(qStart / 3)} ${year})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

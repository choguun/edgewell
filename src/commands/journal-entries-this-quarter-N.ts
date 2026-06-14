// @ts-nocheck
// `edgewell journal-entries-this-quarter-N <day-of-month>`
// lists the journal entries for the Nth day of the current
// quarter, across all matching years. v3.0.0 keeps the
// filter in JS.

import { c } from "../cli.js";

function quarterStart(monthIdx0) {
  return monthIdx0 - (monthIdx0 % 3) + 1;
}

function quarterEndMonth(monthIdx0) {
  return quarterStart(monthIdx0) + 2;
}

export async function journalEntriesThisQuarterNCommand(args, ew) {
  const day = Number(args[0]);
  if (!Number.isFinite(day) || day < 1 || day > 31) {
    console.error("usage: edgewell journal-entries-this-quarter-N <day-of-month>");
    process.exit(2);
  }
  const now = new Date();
  const year = now.getUTCFullYear();
  const qStart = quarterStart(now.getUTCMonth());
  const qEnd = quarterEndMonth(now.getUTCMonth());
  const dayStr = String(day).padStart(2, "0");
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
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
    console.log(c.dim(`(no entries on day ${day} of Q${Math.ceil(qStart / 3)} ${year})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

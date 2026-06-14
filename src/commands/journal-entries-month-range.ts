// @ts-nocheck
// `edgewell journal-entries-month-range <start-YYYY-MM>
// <end-YYYY-MM>` lists the journal entries in the inclusive
// month range [start, end]. v3.0.0 keeps the filter in JS.

import { c } from "../cli.js";

export async function journalEntriesMonthRangeCommand(args, ew) {
  const start = String(args[0] ?? "");
  const end = String(args[1] ?? "");
  if (!/^\d{4}-\d{2}$/.test(start) || !/^\d{4}-\d{2}$/.test(end) || start > end) {
    console.error("usage: edgewell journal-entries-month-range <start-YYYY-MM> <end-YYYY-MM>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => {
    const m = (e._ts ?? "").slice(0, 7);
    return m >= start && m <= end;
  });
  if (matches.length === 0) {
    console.log(c.dim(`(no entries in ${start}..${end})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

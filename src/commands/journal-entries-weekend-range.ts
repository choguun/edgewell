// @ts-nocheck
// `edgewell journal-entries-weekend-range <start-YYYY-MM-DD>
// <end-YYYY-MM-DD>` lists the journal entries on weekend
// days within the inclusive day range. v3.0.0 keeps the
// filter in JS.

import { c } from "../cli.js";

export async function journalEntriesWeekendRangeCommand(args, ew) {
  const start = String(args[0] ?? "");
  const end = String(args[1] ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || start > end) {
    console.error("usage: edgewell journal-entries-weekend-range <start-YYYY-MM-DD> <end-YYYY-MM-DD>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => {
    const d = (e._ts ?? "").slice(0, 10);
    if (d < start || d > end) return false;
    const dt = new Date(d);
    const dow = dt.getUTCDay();
    return dow === 0 || dow === 6;
  });
  if (matches.length === 0) {
    console.log(c.dim(`(no weekend entries in ${start}..${end})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

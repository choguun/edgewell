// @ts-nocheck
// `edgewell journal-entries-counts-by-month` lists a count
// of journal entries per month. v3.0.0 keeps the aggregation
// in JS.

import { c } from "../cli.js";

export async function journalEntriesCountsByMonthCommand(args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const counts = new Map();
  for (const e of all) {
    const ym = (e._ts ?? "").slice(0, 7);
    if (!ym) continue;
    counts.set(ym, (counts.get(ym) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort();
  for (const [ym, n] of sorted) {
    console.log(`${ym}  ${n}`);
  }
}

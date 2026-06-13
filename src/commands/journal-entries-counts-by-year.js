// `edgewell journal-entries-counts-by-year` lists a count
// of journal entries per year. v3.0.0 keeps the aggregation
// in JS.

import { c } from "../cli.js";

export async function journalEntriesCountsByYearCommand(args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const counts = new Map();
  for (const e of all) {
    const y = (e._ts ?? "").slice(0, 4);
    if (!y) continue;
    counts.set(y, (counts.get(y) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort();
  for (const [y, n] of sorted) {
    console.log(`${y}  ${n}`);
  }
}

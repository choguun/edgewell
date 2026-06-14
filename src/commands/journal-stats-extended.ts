// @ts-nocheck
// `edgewell journal-stats-extended` is a richer version of
// `journal-stats` that also breaks down by month. v3.0.0 keeps
// the aggregation offline.

import { c, header } from "../cli.js";

export async function journalStatsExtendedCommand(_args, ew) {
  header("Journal stats (extended)");
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries yet)"));
    return;
  }
  const byMonth = new Map();
  for (const e of all) {
    const month = (e._ts ?? "").slice(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0) + 1);
  }
  console.log(`${c.bold("total:")}  ${all.length}`);
  console.log(c.dim("by month:"));
  for (const [m, n] of [...byMonth.entries()].sort()) {
    console.log(`  ${m}  ${n}`);
  }
}

// `edgewell journal-stats-detailed` is the most detailed
// journal report. v3.0.0 keeps the aggregation in JS and
// includes per-day counts, per-tag counts, and top entries
// by length.

import { c, header } from "../cli.js";

export async function journalStatsDetailedCommand(_args, ew) {
  header("Journal stats (detailed)");
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries yet)"));
    return;
  }
  const byDay = new Map();
  for (const e of all) {
    const d = (e._ts ?? "").slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }
  const byTag = new Map();
  for (const e of all) {
    for (const t of e.tags ?? []) {
      byTag.set(t, (byTag.get(t) ?? 0) + 1);
    }
  }
  const longest = [...all].sort((a, b) => (b.text?.length ?? 0) - (a.text?.length ?? 0)).slice(0, 3);
  console.log(`${c.bold("total:")}  ${all.length}`);
  console.log(`${c.bold("days:")}   ${byDay.size}`);
  console.log(`${c.bold("tags:")}   ${byTag.size}`);
  console.log(c.dim("top tags:"));
  for (const [t, n] of [...byTag.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
    console.log(`  ${t.padEnd(16)} ${n}`);
  }
  console.log(c.dim("longest entries:"));
  for (const e of longest) {
    console.log(`  ${String((e.text ?? "").length).padStart(4)}c  ${(e.text ?? "").slice(0, 50)}…`);
  }
}

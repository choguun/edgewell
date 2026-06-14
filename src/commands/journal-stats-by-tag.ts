// @ts-nocheck
// `edgewell journal-stats-by-tag` prints the per-tag breakdown
// of journal entries as a one-line per tag. v3.0.0 keeps the
// aggregation offline.

import { c, header } from "../cli.js";

export async function journalStatsByTagCommand(_args, ew) {
  header("Journal entries by tag");
  const all = await ew.journal.readAll();
  const counts = new Map();
  for (const e of all) {
    for (const t of e.tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  if (counts.size === 0) {
    console.log(c.dim("(no tagged entries)"));
    return;
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [t, n] of sorted) {
    console.log(`  ${c.cyan(t.padEnd(16))} ${n}`);
  }
}

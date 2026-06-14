// @ts-nocheck
// `edgewell journal-stats-quick-by-tag` is a quick per-tag
// summary. v3.0.0 keeps the aggregation offline.

import { c } from "../cli.js";

export async function journalStatsQuickByTagCommand(_args, ew) {
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
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  console.log(`${c.bold("tags:")} ${counts.size}, ${c.bold("uses:")} ${total}, ${c.bold("avg:")} ${(total / counts.size).toFixed(1)}`);
}

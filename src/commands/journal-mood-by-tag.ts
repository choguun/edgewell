// @ts-nocheck
// `edgewell journal-mood-by-tag` prints the average mood per
// tag. v3.0.0 keeps the aggregation offline.

import { c, header } from "../cli.js";

export async function journalMoodByTagCommand(_args, ew) {
  header("Mood by tag");
  const all = await ew.journal.readAll();
  const byTag = new Map();
  for (const e of all) {
    if (!Number.isFinite(Number(e.mood))) continue;
    for (const t of e.tags ?? []) {
      if (!byTag.has(t)) byTag.set(t, { sum: 0, count: 0 });
      const r = byTag.get(t);
      r.sum += Number(e.mood);
      r.count++;
    }
  }
  if (byTag.size === 0) {
    console.log(c.dim("(no mood-tagged entries)"));
    return;
  }
  const sorted = [...byTag.entries()]
    .map(([t, { sum, count }]) => ({ tag: t, avg: sum / count, count }))
    .sort((a, b) => b.avg - a.avg);
  for (const { tag, avg, count } of sorted) {
    console.log(`  ${c.cyan(tag.padEnd(16))} ${avg.toFixed(2).padStart(5)}  (n=${count})`);
  }
}

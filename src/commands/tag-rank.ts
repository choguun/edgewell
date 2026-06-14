// @ts-nocheck
// `edgewell tag-rank` ranks journal tags by the average length of
// the entries that carry them. Surfaces tags whose entries are
// unusually long (or short) — a hint at where the user writes
// the most.

import { c, header } from "../cli.js";

export async function tagRankCommand(_args, ew) {
  header("Tag rank (by avg entry length)");
  const all = await ew.journal.readAll();
  const byTag = new Map();
  for (const e of all) {
    const len = (e.text ?? "").length;
    for (const t of e.tags ?? []) {
      let rec = byTag.get(t);
      if (!rec) {
        rec = { total: 0, count: 0 };
        byTag.set(t, rec);
      }
      rec.total += len;
      rec.count++;
    }
  }
  if (byTag.size === 0) {
    console.log(c.dim("(no tagged entries)"));
    return;
  }
  const sorted = [...byTag.entries()]
    .map(([t, r]) => ({ tag: t, avg: r.total / r.count }))
    .sort((a, b) => b.avg - a.avg);
  for (const { tag, avg } of sorted) {
    console.log(`  ${c.cyan(tag.padEnd(16))} ${avg.toFixed(1)} chars`);
  }
}

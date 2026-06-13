// `edgewell tag-cooccurrence-monthly` lists the most common
// pair of tags per month. v3.0.0 keeps the aggregation offline.

import { c, header } from "../cli.js";

export async function tagCooccurrenceMonthlyCommand(_args, ew) {
  header("Most co-occurring pair per month");
  const all = await ew.journal.readAll();
  const byMonth = new Map();
  for (const e of all) {
    const month = (e._ts ?? "").slice(0, 7);
    if (!byMonth.has(month)) byMonth.set(month, new Map());
    const tags = [...(e.tags ?? [])].sort();
    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        const inner = byMonth.get(month);
        const k = `${tags[i]}+${tags[j]}`;
        inner.set(k, (inner.get(k) ?? 0) + 1);
      }
    }
  }
  for (const [month, pairs] of [...byMonth.entries()].sort()) {
    const sorted = [...pairs.entries()].sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) continue;
    const [topPair, topCount] = sorted[0];
    console.log(`  ${c.cyan(month)}  ${topPair} (${topCount})`);
  }
}

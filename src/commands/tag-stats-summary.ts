// @ts-nocheck
// `edgewell tag-stats-summary` prints a one-line summary of
// the tag vocabulary. v3.0.0 keeps the aggregation offline.

import { c } from "../cli.js";

export async function tagStatsSummaryCommand(_args, ew) {
  const all = await ew.journal.readAll();
  const counts = new Map();
  for (const e of all) {
    for (const t of e.tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  if (counts.size === 0) {
    console.log(c.dim("(no tags used yet)"));
    return;
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  const max = Math.max(...counts.values());
  const min = Math.min(...counts.values());
  console.log(`${counts.size} tags, ${total} uses, max ${max}/tag, min ${min}/tag`);
}

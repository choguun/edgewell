// @ts-nocheck
// `edgewell tag-cooccurrence-summary` is a one-line summary
// of tag co-occurrence. v3.0.0 keeps the aggregation offline.

import { c } from "../cli.js";

export async function tagCooccurrenceSummaryCommand(_args, ew) {
  const all = await ew.journal.readAll();
  const pairs = new Map();
  for (const e of all) {
    const tags = [...(e.tags ?? [])].sort();
    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        const k = `${tags[i]}::${tags[j]}`;
        pairs.set(k, (pairs.get(k) ?? 0) + 1);
      }
    }
  }
  if (pairs.size === 0) {
    console.log(c.dim("(no co-occurring pairs)"));
    return;
  }
  const max = Math.max(...pairs.values());
  console.log(`${pairs.size} unique pairs, max ${max} co-occurrences`);
}

// @ts-nocheck
// `edgewell tag-density` prints the average number of tags per
// journal entry. v3.0.0 keeps the aggregation offline.

import { c } from "../cli.js";

export async function tagDensityCommand(_args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const totalTags = all.reduce((s, e) => s + (e.tags?.length ?? 0), 0);
  const avg = totalTags / all.length;
  console.log(`${c.bold("avg tags/entry:")} ${avg.toFixed(2)}  (${totalTags} tags across ${all.length} entries)`);
}

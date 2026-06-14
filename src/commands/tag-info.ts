// @ts-nocheck
// `edgewell tag-info <tag>` prints a detailed report for a
// single tag: count, first, last, distinct days, and the
// co-occurring tags. v3.0.0 keeps the aggregation offline.

import { c, header } from "../cli.js";

export async function tagInfoCommand(args, ew) {
  const tag = args[0];
  if (!tag) {
    console.error("usage: edgewell tag-info <tag>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  const matches = all.filter((e) => (e.tags ?? []).includes(tag));
  if (matches.length === 0) {
    console.log(c.dim(`(no entries with tag "${tag}")`));
    return;
  }
  const days = new Set(matches.map((e) => (e._ts ?? "").slice(0, 10)));
  const cooccurring = new Map();
  for (const e of matches) {
    for (const t of e.tags ?? []) {
      if (t === tag) continue;
      cooccurring.set(t, (cooccurring.get(t) ?? 0) + 1);
    }
  }
  const top = [...cooccurring.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  header(`Tag info: ${tag}`);
  console.log(`${c.bold("count:")}    ${matches.length}`);
  console.log(`${c.bold("distinct days:")} ${days.size}`);
  console.log(`${c.bold("first:")}    ${matches[0]._ts}`);
  console.log(`${c.bold("last:")}     ${matches[matches.length - 1]._ts}`);
  if (top.length > 0) {
    console.log(c.bold("top co-occurring:"));
    for (const [t, n] of top) console.log(`  ${t.padEnd(16)} ${n}`);
  }
}

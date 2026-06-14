// @ts-nocheck
// `edgewell tag-pairs` lists the most common pairs of tags.
// Sibling to `tag-cooccurrence` but with a different default
// limit and a different output format.

import { c, header } from "../cli.js";

export async function tagPairsCommand(_args, ew) {
  header("Tag pairs");
  const all = await ew.journal.readAll();
  const counts = new Map();
  for (const e of all) {
    const tags = [...(e.tags ?? [])].sort();
    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        const key = `${tags[i]}+${tags[j]}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }
  if (counts.size === 0) {
    console.log(c.dim("(no co-occurring tags yet)"));
    return;
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  for (const [pair, n] of sorted) {
    console.log(`  ${c.cyan(pair.padEnd(30))} ${n}`);
  }
}

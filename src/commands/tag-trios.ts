// @ts-nocheck
// `edgewell tag-trios` lists the most common triples of tags.
// v3.0.0 keeps the aggregation offline.

import { c, header } from "../cli.js";

export async function tagTriosCommand(_args, ew) {
  header("Tag trios");
  const all = await ew.journal.readAll();
  const counts = new Map();
  for (const e of all) {
    const tags = [...(e.tags ?? [])].sort();
    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        for (let k = j + 1; k < tags.length; k++) {
          const key = `${tags[i]}+${tags[j]}+${tags[k]}`;
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      }
    }
  }
  if (counts.size === 0) {
    console.log(c.dim("(no triple-co-occurring tags yet)"));
    return;
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  for (const [trio, n] of sorted) {
    console.log(`  ${c.cyan(trio.padEnd(40))} ${n}`);
  }
}

// `edgewell tag-cooccurrence` prints the most common pairs of
// tags that appear together on a single journal entry. v3.0.0
// keeps this offline.

import { c, header } from "../cli.js";

export async function tagCooccurrenceCommand(_args, ew) {
  header("Tag co-occurrence");
  const all = await ew.journal.readAll();
  const pairCounts = new Map();
  for (const e of all) {
    const tags = [...(e.tags ?? [])].sort();
    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        const key = `${tags[i]}::${tags[j]}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  }
  if (pairCounts.size === 0) {
    console.log(c.dim("(no co-occurring tags yet)"));
    return;
  }
  const sorted = [...pairCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  for (const [pair, n] of sorted) {
    const [a, b] = pair.split("::");
    console.log(`  ${c.cyan(a.padEnd(12))} + ${c.cyan(b.padEnd(12))} = ${n}`);
  }
}

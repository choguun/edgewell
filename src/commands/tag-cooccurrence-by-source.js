// `edgewell tag-cooccurrence-by-source` groups co-occurrence
// pairs by RAG source. v3.0.0 keeps the aggregation offline.

import { c, header } from "../cli.js";

export async function tagCooccurrenceBySourceCommand(_args, ew) {
  const all = await ew.journal.readAll();
  const bySource = new Map();
  for (const e of all) {
    const source = "journal";
    if (!bySource.has(source)) bySource.set(source, new Map());
    const tags = [...(e.tags ?? [])].sort();
    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        const k = `${tags[i]}+${tags[j]}`;
        const inner = bySource.get(source);
        inner.set(k, (inner.get(k) ?? 0) + 1);
      }
    }
  }
  for (const [source, pairs] of bySource) {
    if (pairs.size === 0) continue;
    header(`Co-occurrence from ${source}`);
    const sorted = [...pairs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    for (const [pair, n] of sorted) {
      console.log(`  ${c.cyan(pair.padEnd(30))} ${n}`);
    }
  }
}

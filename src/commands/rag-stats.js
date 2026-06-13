// `edgewell rag-stats` reports simple stats about the lexical
// RAG index: chunk count, distinct sources, and the top 5
// sources by chunk count. v3.0.0 keeps the aggregation in JS.

import { c, header } from "../cli.js";

export async function ragStatsCommand(_args, ew) {
  header("RAG stats");
  await ew.rag._ensure();
  const chunks = ew.rag.chunks ?? [];
  const sources = new Map();
  for (const c1 of chunks) {
    sources.set(c1.source, (sources.get(c1.source) ?? 0) + 1);
  }
  console.log(`${c.bold("chunks:")}    ${chunks.length}`);
  console.log(`${c.bold("sources:")}   ${sources.size}`);
  if (sources.size > 0) {
    console.log(c.dim("top sources:"));
    for (const [s, n] of [...sources.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
      console.log(`  ${s.padEnd(24)} ${n}`);
    }
  }
}

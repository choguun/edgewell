// `edgewell rag-top <N>` lists the top N most-frequent RAG
// sources. v3.0.0 keeps the aggregation offline.

import { c, header } from "../cli.js";

export async function ragTopCommand(args, ew) {
  const n = Number(args[0] ?? 5);
  if (!Number.isFinite(n) || n <= 0) {
    console.error("usage: edgewell rag-top [N]");
    process.exit(2);
  }
  await ew.rag._ensure();
  const counts = new Map();
  for (const c1 of ew.rag.chunks ?? []) {
    counts.set(c1.source, (counts.get(c1.source) ?? 0) + 1);
  }
  if (counts.size === 0) {
    console.log(c.dim("(RAG is empty)"));
    return;
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
  header(`RAG top ${n} sources`);
  for (const [src, count] of sorted) {
    console.log(`  ${String(count).padStart(4)}  ${src}`);
  }
}

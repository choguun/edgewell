// @ts-nocheck
// `edgewell journal-rag-count` is a thin alias around `rag-stats`.
// Sibling to `journal-rag-top`.

export async function journalRagCountCommand(_args, ew) {
  const { ragStatsCommand } = await import("./rag-stats.js");
  return ragStatsCommand(_args, ew);
}

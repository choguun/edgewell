// Example plugin: rag-stats. Demonstrates the v3.0.0
// `onLoad` hook by reporting RAG size and chunk distribution at
// start-up.

export default {
  name: "rag-stats-example",
  version: "0.1.0",
  hooks: {
    onLoad({ ew, log }) {
      const chunks = ew.rag?.chunks ?? [];
      const sources = new Map();
      for (const c of chunks) {
        sources.set(c.source, (sources.get(c.source) ?? 0) + 1);
      }
      log.info("rag-stats-example", {
        totalChunks: chunks.length,
        distinctSources: sources.size,
        topSources: [...sources.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3),
      });
    },
  },
};

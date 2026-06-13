// `edgewell hybrid "<query>"` runs the v3.0.0 HybridSearch across
// the lexical TF-IDF RAG and the vector RAG. Each hit is tagged
// with the retriever that contributed it.

import { VectorIndex } from "../vector-index.js";
import { HybridSearch } from "../hybrid-search.js";
import { rerank } from "../reranker.js";
import { c, header } from "../cli.js";

export async function hybridCommand(args, ew) {
  const query = args.join(" ").trim();
  if (!query) {
    console.error("usage: edgewell hybrid \"<query>\"");
    process.exit(2);
  }
  header(`Hybrid search: ${query}`);
  const idx = new VectorIndex({ dim: 128 });
  await ew.rag._ensure();
  for (const chunk of ew.rag.chunks) {
    await idx.ingest({ source: chunk.source, text: chunk.text });
  }
  const hs = new HybridSearch({ lexical: ew.rag, vector: idx });
  const hits = await hs.search(query, 5);
  const reranked = rerank(query, hits);
  if (reranked.length === 0) {
    console.log(c.yellow("no hits"));
    return;
  }
  for (const h of reranked) {
    const kind = h.payload?.kind ?? "?";
    const src = h.payload?.source ?? h.payload?.id ?? "?";
    console.log(`${c.cyan(kind.padEnd(8))} ${c.dim(`score=${h.score.toFixed(4)}`)} ${src}`);
  }
}

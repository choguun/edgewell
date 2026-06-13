// VectorIndex: combines an embedder, a VectorStore, and a chunker
// to provide a "give me text in, get top-k matches out" interface
// that mirrors the existing RagIndex API in `rag.js`.
//
// This is the v3.0.0 replacement for plain TF-IDF. It is intentionally
// additive: the existing RagIndex keeps working and is used as a
// lexical fallback inside `hybrid-search.js`.

import { VectorStore } from "./vector-store.js";
import { makeEmbedder } from "./embedder.js";

function chunkText(text, size = 400, overlap = 50) {
  const chunks = [];
  const step = Math.max(1, size - overlap);
  for (let i = 0; i < text.length; i += step) {
    const end = Math.min(text.length, i + size);
    const slice = text.slice(i, end).trim();
    if (slice) chunks.push(slice);
    if (end >= text.length) break;
  }
  return chunks;
}

export class VectorIndex {
  constructor({ dim = 128, embedder = null, chunkSize = 400, chunkOverlap = 50, topK = 4 } = {}) {
    this.dim = dim;
    this.embed = embedder ?? makeEmbedder({ dim, kind: "hash" });
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
    this.topK = topK;
    this.store = new VectorStore({ dim });
  }

  async ingest({ source, text }) {
    const pieces = chunkText(text, this.chunkSize, this.chunkOverlap);
    for (let i = 0; i < pieces.length; i++) {
      const vec = await this.embed(pieces[i]);
      const id = `${source}#${i}`;
      this.store.upsert(id, vec, { source, text: pieces[i] });
    }
    return pieces.length;
  }

  async search(query, k = this.topK) {
    const vec = await this.embed(query);
    return this.store.search(vec, k);
  }
}

// VectorIndex: combines an embedder, a VectorStore, and a chunker
// to provide a "give me text in, get top-k matches out" interface
// that mirrors the existing RagIndex API in `rag.js`.
//
// This is the v3.0.0 replacement for plain TF-IDF. It is intentionally
// additive: the existing RagIndex keeps working and is used as a
// lexical fallback inside `hybrid-search.js`.

import { createHash } from "node:crypto";
import { VectorStore, type VectorSearchHit } from "./vector-store.js";
import { makeEmbedder, type Embedder } from "./embedder.js";

function chunkText(text: string, size: number = 400, overlap: number = 50): string[] {
  const chunks: string[] = [];
  const step = Math.max(1, size - overlap);
  for (let i = 0; i < text.length; i += step) {
    const end = Math.min(text.length, i + size);
    const slice = text.slice(i, end).trim();
    if (slice) chunks.push(slice);
    if (end >= text.length) break;
  }
  return chunks;
}

// Stable 12-char content hash for a chunk. Used to derive the
// vector-store id so that two distinct single-chunk texts from the
// same source don't collide.
function hashChunk(text: string): string {
  return createHash("sha1").update(String(text)).digest("hex").slice(0, 12);
}

export interface VectorIndexOptions {
  dim?: number;
  embedder?: Embedder | null;
  chunkSize?: number;
  chunkOverlap?: number;
  topK?: number;
}

export interface VectorIngestInput {
  source: string;
  text: string;
}

export class VectorIndex {
  public dim: number;
  public embed: Embedder;
  public chunkSize: number;
  public chunkOverlap: number;
  public topK: number;
  public store: VectorStore;

  constructor({
    dim = 128,
    embedder = null,
    chunkSize = 400,
    chunkOverlap = 50,
    topK = 4,
  }: VectorIndexOptions = {}) {
    this.dim = dim;
    this.embed = embedder ?? makeEmbedder({ dim, kind: "hash" });
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
    this.topK = topK;
    this.store = new VectorStore({ dim });
  }

  async ingest({ source, text }: VectorIngestInput): Promise<number> {
    const pieces = chunkText(text, this.chunkSize, this.chunkOverlap);
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i] ?? "";
      const vec = await this.embed(piece);
      // Use a content-derived id so that ingesting the same text from
      // the same source multiple times is an upsert, and so that two
      // distinct single-chunk texts from the same source don't collide
      // (which they used to with the old `${source}#${i}` id).
      const id = `${source}#${i}#${hashChunk(piece)}`;
      this.store.upsert(id, vec, { source, text: piece });
    }
    return pieces.length;
  }

  async search(query: string, k: number = this.topK): Promise<VectorSearchHit[]> {
    const vec = await this.embed(query);
    return this.store.search(vec, k);
  }
}

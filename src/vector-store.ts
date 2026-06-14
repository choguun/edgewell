// Simple in-memory vector store. Holds vectors keyed by id, supports
// top-k search via cosine similarity. The store is intentionally
// minimal so it can be swapped for a native index (hnswlib, faiss, …)
// later without touching the embedding pipeline.

import { cosine } from "./vector-rag.js";

export type Vector = Float64Array;

export interface VectorRecord {
  id: string;
  vector: Vector;
  payload: unknown;
}

export interface VectorSearchHit {
  id: string;
  score: number;
  payload: unknown;
}

export interface VectorStoreOptions {
  dim?: number;
}

export class VectorStore {
  public dim: number;
  public records: Map<string, VectorRecord> = new Map();

  constructor({ dim = 128 }: VectorStoreOptions = {}) {
    this.dim = dim;
  }

  size(): number {
    return this.records.size;
  }

  upsert(id: string, vector: Vector, payload: unknown = null): void {
    if (vector.length !== this.dim) {
      throw new Error(`vector length ${vector.length} != dim ${this.dim}`);
    }
    this.records.set(id, { id, vector, payload });
  }

  remove(id: string): boolean {
    return this.records.delete(id);
  }

  get(id: string): VectorRecord | null {
    return this.records.get(id) ?? null;
  }

  search(queryVector: Vector, k: number = 5): VectorSearchHit[] {
    if (queryVector.length !== this.dim) {
      throw new Error(`query length ${queryVector.length} != dim ${this.dim}`);
    }
    const scored: VectorSearchHit[] = [];
    for (const rec of this.records.values()) {
      scored.push({ id: rec.id, score: cosine(queryVector, rec.vector), payload: rec.payload });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }
}

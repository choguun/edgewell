// Simple in-memory vector store. Holds vectors keyed by id, supports
// top-k search via cosine similarity. The store is intentionally
// minimal so it can be swapped for a native index (hnswlib, faiss, …)
// later without touching the embedding pipeline.

import { cosine } from "./vector-rag.js";

export class VectorStore {
  constructor({ dim = 128 } = {}) {
    this.dim = dim;
    /** @type {Map<string, {id:string, vector:Float64Array, payload:any}>} */
    this.records = new Map();
  }

  size() {
    return this.records.size;
  }

  upsert(id, vector, payload = null) {
    if (vector.length !== this.dim) {
      throw new Error(`vector length ${vector.length} != dim ${this.dim}`);
    }
    this.records.set(id, { id, vector, payload });
  }

  remove(id) {
    return this.records.delete(id);
  }

  get(id) {
    return this.records.get(id) ?? null;
  }

  search(queryVector, k = 5) {
    if (queryVector.length !== this.dim) {
      throw new Error(`query length ${queryVector.length} != dim ${this.dim}`);
    }
    const scored = [];
    for (const rec of this.records.values()) {
      scored.push({ id: rec.id, score: cosine(queryVector, rec.vector), payload: rec.payload });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }
}

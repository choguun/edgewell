// @ts-nocheck
// Hybrid search: combines the lexical RagIndex and the vector
// VectorIndex using reciprocal rank fusion. The "best of both worlds"
// mode that v3.0.0 enables — lexical precision for exact terms
// (medication names, dollar amounts) plus vector recall for
// paraphrased concepts.

import { reciprocalRankFusion } from "./retrieval-fusion.js";

export class HybridSearch {
  constructor({ lexical, vector, k0 = 60 }) {
    this.lexical = lexical;
    this.vector = vector;
    this.k0 = k0;
  }

  async search(query, k = 5) {
    const [lex, vec] = await Promise.all([
      this.lexical.search(query, k * 2),
      this.vector.search(query, k * 2),
    ]);
    const lexEntries = lex.map((h) => ({
      id: `${h.source}::${h.text.slice(0, 32)}`,
      score: h.score,
      payload: { source: h.source, text: h.text, score: h.score, kind: "lexical" },
    }));
    const vecEntries = vec.map((h) => ({
      id: String(h.id),
      score: h.score,
      payload: { ...(h.payload ?? {}), score: h.score, kind: "vector" },
    }));
    return reciprocalRankFusion([lexEntries, vecEntries], { k0: this.k0 }).slice(0, k);
  }
}

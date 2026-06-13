// Vector RAG module. Pluggable embedding backends, cosine similarity
// search, and a small in-memory vector store. This module is the
// foundation of v3.0.0 "Senses & Memory": it adds a memory layer
// alongside the existing TF-IDF RAG in `rag.js`.
//
// Default embedder is a deterministic, dependency-free hash embedder
// that produces 128-dim unit vectors. The real QVAC embedder is wired
// up via the `llmEmbed` factory parameter; tests inject a fake.

const DEFAULT_DIM = 128;

// Hash a token to a stable integer in [0, 2^32).
function hash32(token, seed) {
  let h = 2166136261 ^ seed;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function hashEmbedder({ dim = DEFAULT_DIM, seed = 0xc0ffee } = {}) {
  return function embed(text) {
    const tokens = String(text).toLowerCase().match(/[a-z0-9]+/g) ?? [];
    const v = new Float64Array(dim);
    if (tokens.length === 0) return v;
    for (const t of tokens) {
      const h = hash32(t, seed);
      const idx = h % dim;
      const sign = (h & 1) === 0 ? 1 : -1;
      v[idx] += sign;
    }
    // L2 normalise so cosine similarity is just a dot product.
    let norm = 0;
    for (let i = 0; i < dim; i++) norm += v[i] * v[i];
    norm = Math.sqrt(norm) || 1;
    for (let i = 0; i < dim; i++) v[i] /= norm;
    return v;
  };
}

export function cosine(a, b) {
  if (a.length !== b.length) throw new Error("dimension mismatch");
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

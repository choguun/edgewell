// Reciprocal Rank Fusion. Combines ranked lists from multiple
// retrievers into a single ranked list. Used by `hybrid-search.js` to
// merge lexical (TF-IDF) and vector hits.
//
// Standard RRF: score(d) = Σ 1 / (k0 + rank_i(d))
// k0 is a smoothing constant, usually 60.

const DEFAULT_K0 = 60;

export function reciprocalRankFusion(lists, { k0 = DEFAULT_K0 } = {}) {
  const scores = new Map();
  const payloads = new Map();
  for (const list of lists) {
    list.forEach((entry, rank) => {
      const id = entry.id ?? entry.chunk?.id;
      if (!id) return;
      const contribution = 1 / (k0 + rank + 1);
      scores.set(id, (scores.get(id) ?? 0) + contribution);
      if (!payloads.has(id)) {
        // Store the inner payload when present, otherwise the entry itself.
        payloads.set(id, entry.payload !== undefined ? entry.payload : entry);
      }
    });
  }
  const merged = [...scores.entries()].map(([id, score]) => ({
    id,
    score,
    payload: payloads.get(id),
  }));
  merged.sort((a, b) => b.score - a.score);
  return merged;
}

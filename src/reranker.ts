// @ts-nocheck
// Lightweight re-ranker. After hybrid retrieval, we may want a second
// pass that down-weights very long chunks and boosts chunks that share
// rare bigrams with the query. v3.0.0 keeps this pure-JS so the
// offline test suite stays green; a learned cross-encoder is a future
// drop-in.

const RARE_BIGRAM_WEIGHT = 0.05;
const LENGTH_PENALTY = 0.0001;

function bigrams(tokens) {
  const out = new Set();
  for (let i = 0; i < tokens.length - 1; i++) out.add(`${tokens[i]} ${tokens[i + 1]}`);
  return out;
}

function tokens(s) {
  return (s.toLowerCase().match(/[a-z0-9]+/g) || []);
}

export function rerank(query, hits) {
  const q = bigrams(tokens(query));
  return hits
    .map((h) => {
      const text = h.payload?.text ?? h.text ?? "";
      const b = bigrams(tokens(text));
      let shared = 0;
      for (const x of b) if (q.has(x)) shared++;
      const boost = shared * RARE_BIGRAM_WEIGHT;
      const penalty = text.length * LENGTH_PENALTY;
      return { ...h, score: h.score + boost - penalty };
    })
    .sort((a, b) => b.score - a.score);
}

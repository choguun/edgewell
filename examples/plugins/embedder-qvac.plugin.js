// Example plugin: embedder-qvac. Demonstrates the v3.0.0
// `registerEmbedder` hook by exposing a stub QVAC embedder that
// returns a 128-dim unit vector. In production this would call
// into the real @qvac/sdk embedding model.

export default {
  name: "embedder-qvac-example",
  version: "0.1.0",
  hooks: {
    registerEmbedder({ register }) {
      register({
        name: "qvac-stub",
        dim: 128,
        embed: async (text) => {
          // Deterministic 128-dim unit vector derived from the
          // text. Real QVAC embeddings would call into the SDK.
          const v = new Float64Array(128);
          for (let i = 0; i < text.length; i++) {
            const c = text.charCodeAt(i);
            v[(c * 31 + i) % 128] += 1;
          }
          let norm = 0;
          for (let i = 0; i < 128; i++) norm += v[i] * v[i];
          norm = Math.sqrt(norm) || 1;
          for (let i = 0; i < 128; i++) v[i] /= norm;
          return v;
        },
      });
    },
  },
};

// Example plugin: custom embedder. Demonstrates the v3.0.0
// `registerEmbedder` hook by exposing a slightly different hash
// embedder (different seed, different dimension) that callers can
// select via `makeEmbedder({ kind: "hash64" })`.

import { hashEmbedder } from "../../src/vector-rag.js";

export default {
  name: "embedder-hash64",
  version: "0.1.0",
  hooks: {
    registerEmbedder({ register }) {
      register({
        name: "hash64",
        dim: 64,
        embed: hashEmbedder({ dim: 64, seed: 0xfeed }),
      });
    },
  },
};

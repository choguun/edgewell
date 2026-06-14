// Embedder factory. Returns a function `text -> Float64Array` that
// embeds text into a fixed-dimension vector. The default is the
// dependency-free hash embedder in `vector-rag.js`. A caller can pass
// a QVAC-backed embedder to use the real model at runtime.
//
// Usage:
//   const embed = makeEmbedder({ dim: 256, kind: "hash" });
//   const v = embed("hello world");

import { hashEmbedder } from "./vector-rag.js";

export type Embedder = (text: string) => Promise<Float64Array> | Float64Array;

export interface MakeEmbedderOptions {
  kind?: "hash" | "qvac";
  dim?: number;
  /** Required for kind: 'qvac'. */
  llm?: { embed(text: string): Promise<Iterable<number> | Float64Array> } | null;
  seed?: number;
}

export function makeEmbedder({
  kind = "hash",
  dim = 128,
  llm = null,
  seed,
}: MakeEmbedderOptions = {}): Embedder {
  if (kind === "hash") {
    return hashEmbedder({ dim, ...(seed !== undefined ? { seed } : {}) });
  }
  if (kind === "qvac") {
    if (!llm) throw new Error("kind: 'qvac' requires an llm with an embed() method");
    return async function embed(text) {
      const out = await llm.embed(String(text));
      return Float64Array.from(out);
    };
  }
  throw new Error(`unknown embedder kind: ${kind}`);
}

// Tiny in-memory RAG: chunk text, build TF-IDF vectors, cosine-similarity search.
// No external deps. Designed for the small personal corpora users will have
// (hundreds to thousands of chunks). Persists chunks to data/rag/chunks.json.

import { promises as fs } from "node:fs";
import path from "node:path";

const STOP = new Set(
  ("a an and are as at be by for from has have he her his i in is it its of on or " +
    "she that the to was were will with you your this these those we us our they " +
    "them their but not no so if then than too very can could should would may might " +
    "do does did doing done am been being have has had having about into over under " +
    "again any all most other some such only own same so than too just don't doesn't " +
    "didn't isn't aren't wasn't haven't hasn't hadn't couldn't shouldn't wouldn't")
    .split(/\s+/),
);

function tokenize(s) {
  return (s.toLowerCase().match(/[a-z0-9]+/g) || []).filter((t) => !STOP.has(t) && t.length > 1);
}

function chunkText(text, size, overlap) {
  // Chunk by character windows with word-boundary snapping.
  const chunks = [];
  const step = Math.max(1, size - overlap);
  for (let i = 0; i < text.length; i += step) {
    const end = Math.min(text.length, i + size);
    let slice = text.slice(i, end);
    if (end < text.length) {
      const lastSpace = slice.lastIndexOf(" ");
      if (lastSpace > size * 0.6) slice = slice.slice(0, lastSpace);
    }
    const trimmed = slice.trim();
    if (trimmed) chunks.push(trimmed);
    if (end >= text.length) break;
  }
  return chunks;
}

function termFreq(tokens) {
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  const len = tokens.length || 1;
  for (const [k, v] of tf) tf.set(k, v / len);
  return tf;
}

export class RagIndex {
  constructor({ dir, chunkSize = 400, chunkOverlap = 50, topK = 4 }) {
    this.dir = dir;
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
    this.topK = topK;
    this.chunks = []; // { id, source, text, tokens, tf }
    this.df = new Map(); // doc frequency per term
    this.docs = 0;
  }

  async _ensure() {
    await fs.mkdir(this.dir, { recursive: true });
    const file = path.join(this.dir, "chunks.json");
    try {
      const raw = await fs.readFile(file, "utf8");
      this.chunks = JSON.parse(raw);
      this._rebuildIndex();
    } catch {
      this.chunks = [];
    }
  }

  async _persist() {
    await fs.mkdir(this.dir, { recursive: true });
    await fs.writeFile(path.join(this.dir, "chunks.json"), JSON.stringify(this.chunks));
  }

  _rebuildIndex() {
    this.df = new Map();
    this.docs = this.chunks.length;
    for (const c of this.chunks) {
      const uniq = new Set(c.tokens);
      for (const t of uniq) this.df.set(t, (this.df.get(t) ?? 0) + 1);
    }
  }

  _idf(term) {
    const df = this.df.get(term) ?? 0;
    return Math.log(1 + (this.docs + 1) / (df + 1));
  }

  async ingest({ source, text }) {
    await this._ensure();
    const pieces = chunkText(text, this.chunkSize, this.chunkOverlap);
    let added = 0;
    for (const p of pieces) {
      const tokens = tokenize(p);
      if (tokens.length < 3) continue;
      this.chunks.push({
        id: `${source}#${this.chunks.length}`,
        source,
        text: p,
        tokens,
        tf: [...termFreq(tokens).entries()],
      });
      added++;
    }
    this._rebuildIndex();
    await this._persist();
    return added;
  }

  async ingestFile({ source, filePath }) {
    const text = await fs.readFile(filePath, "utf8");
    return this.ingest({ source, text });
  }

  async search(query, k = this.topK) {
    await this._ensure();
    const qTokens = tokenize(query);
    if (qTokens.length === 0 || this.chunks.length === 0) return [];
    const qTf = termFreq(qTokens);
    const scores = this.chunks.map((c) => {
      const tfMap = new Map(c.tf);
      let score = 0;
      for (const [t, qv] of qTf) {
        const tv = tfMap.get(t);
        if (!tv) continue;
        score += qv * tv * this._idf(t);
      }
      return { chunk: c, score };
    });
    scores.sort((a, b) => b.score - a.score);
    return scores
      .filter((s) => s.score > 0)
      .slice(0, k)
      .map((s) => ({ text: s.chunk.text, source: s.chunk.source, score: s.score }));
  }

  // Build a prompt context block from the top-k chunks.
  async contextBlock(query, k = this.topK) {
    const hits = await this.search(query, k);
    if (hits.length === 0) return "";
    return hits
      .map((h, i) => `[${i + 1}] (${h.source})\n${h.text}`)
      .join("\n\n---\n\n");
  }
}

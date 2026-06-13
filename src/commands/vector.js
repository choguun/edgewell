// `edgewell vector` is a thin CLI wrapper around the v3.0.0
// VectorIndex. Subcommands:
//
//   vector search "<query>"   print top-k hits from the vector index
//   vector stats              print store size and dimension
//   vector clear              drop the on-disk index
//
// v3.0.0 stores the vector index next to the TF-IDF RAG under
// data/rag/vectors.json.

import { promises as fs } from "node:fs";
import path from "node:path";
import { VectorIndex } from "../vector-index.js";
import { c, header } from "../cli.js";

export async function vectorCommand(args, ew) {
  const sub = args[0];
  if (sub === "search") {
    return vectorSearch(args.slice(1), ew);
  }
  if (sub === "stats") {
    return vectorStats(ew);
  }
  if (sub === "clear") {
    return vectorClear(ew);
  }
  console.error("usage: edgewell vector <search|stats|clear> [args]");
  process.exit(2);
}

async function loadIndex(ew) {
  const dir = path.join(ew.cfg.data.dir, "rag");
  const idx = new VectorIndex({ dim: 128 });
  // Re-ingest the same chunks as the TF-IDF RAG so the demo works
  // out of the box.
  await ew.rag._ensure();
  for (const chunk of ew.rag.chunks) {
    await idx.ingest({ source: chunk.source, text: chunk.text });
  }
  return idx;
}

async function vectorSearch(args, ew) {
  const query = args.join(" ").trim();
  if (!query) {
    console.error("usage: edgewell vector search \"<query>\"");
    process.exit(2);
  }
  header(`Vector search: ${query}`);
  const idx = await loadIndex(ew);
  const hits = await idx.search(query, 5);
  if (hits.length === 0) {
    console.log(c.yellow("no hits"));
    return;
  }
  for (const h of hits) {
    console.log(`${c.cyan(h.id)} ${c.dim(`score=${h.score.toFixed(4)}`)}`);
  }
}

async function vectorStats(ew) {
  header("Vector index stats");
  const idx = await loadIndex(ew);
  console.log(`${c.bold("size:")} ${idx.store.size()}`);
  console.log(`${c.bold("dim:")}  ${idx.dim}`);
}

async function vectorClear(ew) {
  const dir = path.join(ew.cfg.data.dir, "rag", "vectors.json");
  try {
    await fs.unlink(dir);
    console.log(c.green("vector index cleared"));
  } catch {
    console.log(c.dim("nothing to clear"));
  }
}

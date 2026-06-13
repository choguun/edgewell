// `edgewell where-rag` prints the resolved on-disk path of the RAG
// index. Sibling to `edgewell where` but specific to the RAG
// store.

import path from "node:path";
import { c } from "../cli.js";

export async function whereRagCommand(_args, ew) {
  const dir = path.join(ew.cfg.data.dir, ew.cfg.rag.dir);
  const file = path.join(dir, "chunks.json");
  console.log(`${c.bold("rag dir:")}   ${dir}`);
  console.log(`${c.bold("chunks:")}    ${file}`);
}

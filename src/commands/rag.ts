// @ts-nocheck
import path from "node:path";
import { c, header } from "../cli.js";

export async function ragCommand(args, ew) {
  const [sub, ...rest] = args;
  if (sub === "ingest") {
    const file = rest[0];
    if (!file) {
      console.error("usage: edgewell rag ingest <file>");
      process.exit(2);
    }
    const abs = path.resolve(file);
    const n = await ew.rag.ingestFile({ source: abs, filePath: abs });
    console.log(c.green(`ingested ${n} chunks from ${abs}`));
  } else if (sub === "search") {
    const q = rest.join(" ").trim();
    if (!q) {
      console.error("usage: edgewell rag search \"<query>\"");
      process.exit(2);
    }
    header(`RAG results for: ${q}`);
    const hits = await ew.rag.search(q, 5);
    if (hits.length === 0) {
      console.log(c.dim("(no matches)"));
      return;
    }
    for (const h of hits) {
      console.log(c.dim(`score ${h.score.toFixed(3)} - ${h.source}`));
      console.log(h.text);
      console.log();
    }
  } else {
    console.error("usage: edgewell rag <ingest|search>");
    process.exit(2);
  }
}

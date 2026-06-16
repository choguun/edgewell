// @ts-nocheck
import { promises as fs } from "node:fs";
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
    // Wrap fs errors so the user sees the same friendly
    // "file not found: <path>" / "<path> is a directory, not a file"
    // style that `import` and `compare` already use. The raw
    // ENOENT/EISDIR text from Node leaks otherwise.
    try {
      const stat = await fs.stat(abs);
      if (stat.isDirectory()) {
        console.error(c.red(`${abs} is a directory, not a file`));
        process.exit(1);
      }
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      if (e?.code === "ENOENT") {
        console.error(c.red(`file not found: ${abs}`));
        process.exit(1);
      }
      console.error(c.red(`cannot read ${abs}: ${e?.message ?? err}`));
      process.exit(1);
    }
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

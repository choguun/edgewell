// `edgewell multimodal` ingests an image, audio, or text file into
// the RAG index and (optionally) the journal. v3.0.0 keeps the
// captioner / transcriber pluggable so offline runs work, but real
// QVAC vision / STT models can be injected from the host app.

import { ingestPath } from "../multimodal/index.js";
import { header, c } from "../cli.js";

export async function multimodalCommand(args, ew) {
  const [file, ...rest] = args;
  if (!file) {
    console.error("usage: edgewell multimodal <file> [--journal] [--rag]");
    process.exit(2);
  }
  const flags = new Set(rest);
  const toJournal = flags.has("--journal");
  const toRag = flags.has("--rag");
  if (!toJournal && !toRag) {
    // Default behaviour in v3.0.0: send to RAG so the LLM can
    // surface the file in future chats.
    flags.add("--rag");
  }
  header(`Multimodal ingest: ${file}`);
  const result = await ingestPath({ filePath: file });
  console.log(c.dim(`kind: ${result.kind}, source: ${result.source}, ${result.bytes} bytes`));
  if (flags.has("--rag")) {
    await ew.rag.ingest({ source: result.source, text: result.text });
    console.log(c.green("indexed in RAG"));
  }
  if (toJournal) {
    await ew.journal.append({
      kind: "journal",
      _ts: new Date().toISOString(),
      text: result.text,
      tags: ["multimodal", result.kind],
    });
    console.log(c.green("appended to journal"));
  }
  console.log("\n" + result.text);
}

// `edgewell sample-journal` writes a small synthetic journal file
// under the data directory and indexes it in the RAG store. Useful
// for a "try it now" demo. v3.0.0 keeps the file content under
// 50 lines so the example fits on a phone screen.

import { promises as fs } from "node:fs";
import path from "node:path";
import { c, header } from "../cli.js";

const SAMPLE = `2026-01-15T07:30:00Z\tSlept 7.5 hours, woke up refreshed.\tsleep
2026-01-15T08:00:00Z\tOatmeal with berries and a coffee.\tmeal
2026-01-15T12:30:00Z\tChicken salad for lunch.\tmeal
2026-01-15T18:00:00Z\t30 minute walk after dinner.\tactivity
2026-01-15T22:00:00Z\tRead 30 pages before bed.\thabit
`;

export async function sampleJournalCommand(_args, ew) {
  header("Sample journal");
  const dataDir = path.resolve(ew.cfg.data.dir);
  const file = path.join(dataDir, "sample_journal.txt");
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(file, SAMPLE);
  console.log(c.green(`wrote ${file}`));
  // Re-ingest into RAG so the LLM can find it.
  const chunks = SAMPLE.split(/\r?\n/).filter(Boolean).map((l) => {
    const [ts, text, tag] = l.split("\t");
    return { _ts: ts, text, tags: [tag] };
  });
  for (const c1 of chunks) {
    await ew.rag.ingest({ source: "sample-journal", text: c1.text });
  }
  console.log(c.green(`ingested ${chunks.length} chunks into RAG`));
}

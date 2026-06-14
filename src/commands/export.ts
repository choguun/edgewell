// @ts-nocheck
// `edgewell export` writes a portable JSON dump of the profile,
// journal, expenses, and RAG summary. v3.0.0 uses the same shape as
// `snapshot` but writes to a user-chosen file path.

import { promises as fs } from "node:fs";
import path from "node:path";
import { c, header } from "../cli.js";

export async function exportCommand(args, ew) {
  const [outPath] = args;
  if (!outPath) {
    console.error("usage: edgewell export <file.json>");
    process.exit(2);
  }
  const abs = path.resolve(outPath);
  header(`Exporting to ${abs}`);
  const profile = await ew.profile.load();
  const journal = await ew.journal.readAll();
  const expenses = await ew.expenses.readAll();
  await ew.rag._ensure();
  const data = {
    version: ew.cfg.version ?? "3.0.0",
    exportedAt: new Date().toISOString(),
    profile,
    journal,
    expenses,
    rag: { chunks: ew.rag.chunks.length },
  };
  await fs.writeFile(abs, JSON.stringify(data, null, 2));
  console.log(c.green(`wrote ${abs} (${journal.length} entries, ${expenses.length} expenses)`));
}

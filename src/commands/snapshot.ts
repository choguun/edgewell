// @ts-nocheck
// `edgewell snapshot` dumps the current profile, last 10 journal
// entries, last 10 expenses, and a RAG summary as a single JSON
// object. Useful for backups and bug reports.

import path from "node:path";

export async function snapshotCommand(_args, ew) {
  const { cfg, profile, journal, expenses, rag } = ew;
  const j = (await journal.readAll()).slice(-10);
  const e = (await expenses.readAll()).slice(-10);
  const p = await profile.load();
  await rag._ensure();
  const snap = {
    version: cfg.version ?? "3.0.0",
    generatedAt: new Date().toISOString(),
    config: { localModel: cfg.localModel, delegateModel: cfg.delegateModel, p2p: cfg.p2p },
    profile: p,
    journal: j,
    expenses: e,
    rag: { chunks: rag.chunks.length, dir: path.relative(process.cwd(), rag.dir) },
  };
  process.stdout.write(JSON.stringify(snap, null, 2) + "\n");
}

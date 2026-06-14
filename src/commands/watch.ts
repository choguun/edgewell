// @ts-nocheck
// `edgewell watch` polls the journal and expenses files for size
// changes and prints a one-line notification on every change. v3.0.0
// uses polling rather than fs.watch so the command works on every
// platform without extra dependencies.

import { promises as fs } from "node:fs";
import path from "node:path";
import { c } from "../cli.js";

async function fileSize(p) {
  try {
    return (await fs.stat(p)).size;
  } catch {
    return 0;
  }
}

export async function watchCommand(args, ew) {
  const intervalMs = Number(args[0] ?? 1000);
  if (!Number.isFinite(intervalMs) || intervalMs < 100) {
    console.error("usage: edgewell watch [intervalMs]");
    process.exit(2);
  }
  const dataDir = path.resolve(ew.cfg.data.dir);
  const journal = path.join(dataDir, ew.cfg.data.journalFile);
  const expenses = path.join(dataDir, ew.cfg.data.expensesFile);
  let jSize = await fileSize(journal);
  let eSize = await fileSize(expenses);
  console.log(c.dim(`watching ${journal} and ${expenses} every ${intervalMs}ms`));
  let stopping = false;
  const stop = () => { stopping = true; };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  for (;;) {
    if (stopping) {
      console.log(c.dim("\nstopped watching."));
      return;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
    const jNew = await fileSize(journal);
    const eNew = await fileSize(expenses);
    if (jNew !== jSize) {
      console.log(`${c.cyan("journal")}  ${jSize} → ${jNew} bytes`);
      jSize = jNew;
    }
    if (eNew !== eSize) {
      console.log(`${c.cyan("expenses")} ${eSize} → ${eNew} bytes`);
      eSize = eNew;
    }
  }
}

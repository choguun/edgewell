// `edgewell size` reports the on-disk size of the data files. The
// CLI is append-only and JSONL-based, so size is a reasonable
// proxy for "how much personal data is on this device?".

import { promises as fs } from "node:fs";
import path from "node:path";
import { c, header } from "../cli.js";

async function fileSize(p) {
  try {
    const s = await fs.stat(p);
    return s.size;
  } catch {
    return 0;
  }
}

function fmt(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export async function sizeCommand(_args, ew) {
  header("Data file sizes");
  const dataDir = path.resolve(ew.cfg.data.dir);
  const files = [
    ["profile", path.join(dataDir, ew.cfg.data.profileFile)],
    ["journal", path.join(dataDir, ew.cfg.data.journalFile)],
    ["expenses", path.join(dataDir, ew.cfg.data.expensesFile)],
    ["rag chunks", path.join(dataDir, ew.cfg.rag.dir, "chunks.json")],
  ];
  let total = 0;
  for (const [label, p] of files) {
    const s = await fileSize(p);
    total += s;
    console.log(`  ${c.cyan(label.padEnd(12))} ${fmt(s).padStart(10)}  ${c.dim(p)}`);
  }
  console.log(`  ${c.bold("total".padEnd(12))} ${fmt(total).padStart(10)}`);
}

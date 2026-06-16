// @ts-nocheck
// `edgewell where` prints the resolved on-disk paths for the data
// stores and config. Helpful for debugging or scripting backups.

import path from "node:path";
import { promises as fs } from "node:fs";
import { c, header } from "../cli.js";

async function status(p) {
  try {
    const s = await fs.stat(p);
    if (s.isDirectory()) return "(dir)";
    return `${s.size} B`;
  } catch {
    return "(not yet created)";
  }
}

export async function whereCommand(_args, ew) {
  header("Resolved file paths");
  const cfg = ew.cfg;
  const dataDir = path.resolve(cfg.data.dir);
  const rows = [
    ["data dir", dataDir, true],
    ["profile", path.join(dataDir, cfg.data.profileFile), false],
    ["journal", path.join(dataDir, cfg.data.journalFile), false],
    ["expenses", path.join(dataDir, cfg.data.expensesFile), false],
    ["rag dir", path.join(dataDir, cfg.rag.dir), true],
  ];
  for (const [label, p, isDir] of rows) {
    let stat = "";
    if (isDir) {
      try {
        await fs.access(p);
        stat = "(dir)";
      } catch {
        stat = "(not yet created)";
      }
    } else {
      stat = await status(p);
    }
    console.log(`  ${c.cyan((label + ":").padEnd(12))} ${p}  ${c.dim(stat)}`);
  }
}

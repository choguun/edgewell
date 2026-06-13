// `edgewell where` prints the resolved on-disk paths for the data
// stores and config. Helpful for debugging or scripting backups.

import path from "node:path";
import { c, header } from "../cli.js";

export async function whereCommand(_args, ew) {
  header("Resolved file paths");
  const cfg = ew.cfg;
  const dataDir = path.resolve(cfg.data.dir);
  const lines = [
    ["data dir", dataDir],
    ["profile", path.join(dataDir, cfg.data.profileFile)],
    ["journal", path.join(dataDir, cfg.data.journalFile)],
    ["expenses", path.join(dataDir, cfg.data.expensesFile)],
    ["rag dir", path.join(dataDir, cfg.rag.dir)],
  ];
  for (const [label, p] of lines) {
    console.log(`  ${c.cyan((label + ":").padEnd(12))} ${p}`);
  }
}

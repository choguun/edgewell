// `edgewell weekly-export <file>` writes the last 7 days of
// journal entries and expenses to a JSON file. v3.0.0 keeps
// the filter in JS so no model is needed.

import { promises as fs } from "node:fs";
import { c, header } from "../cli.js";

export async function weeklyExportCommand(args, ew) {
  const [outPath] = args;
  if (!outPath) {
    console.error("usage: edgewell weekly-export <file.json>");
    process.exit(2);
  }
  const weekAgo = Date.now() - 7 * 86400_000;
  const journal = (await ew.journal.readAll()).filter((e) => new Date(e._ts).getTime() >= weekAgo);
  const expenses = (await ew.expenses.readAll()).filter((e) => new Date(e._ts).getTime() >= weekAgo);
  const profile = await ew.profile.load();
  header("Weekly export");
  const data = {
    version: ew.cfg.version ?? "3.0.0",
    exportedAt: new Date().toISOString(),
    range: "last-7-days",
    profile,
    journal,
    expenses,
  };
  await fs.writeFile(outPath, JSON.stringify(data, null, 2));
  console.log(c.green(`wrote ${outPath} (${journal.length} entries, ${expenses.length} expenses)`));
}

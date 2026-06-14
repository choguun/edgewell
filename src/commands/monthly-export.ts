// @ts-nocheck
// `edgewell monthly-export <file>` writes the current month's
// journal entries and expenses to a JSON file. Sibling to
// `weekly-export`.

import { promises as fs } from "node:fs";
import { c, header } from "../cli.js";

export async function monthlyExportCommand(args, ew) {
  const [outPath] = args;
  if (!outPath) {
    console.error("usage: edgewell monthly-export <file.json>");
    process.exit(2);
  }
  const month = new Date().toISOString().slice(0, 7);
  const journal = (await ew.journal.readAll()).filter((e) => (e._ts ?? "").startsWith(month));
  const expenses = (await ew.expenses.readAll()).filter((e) => (e._ts ?? "").startsWith(month));
  const profile = await ew.profile.load();
  header("Monthly export");
  const data = {
    version: ew.cfg.version ?? "3.0.0",
    exportedAt: new Date().toISOString(),
    range: month,
    profile,
    journal,
    expenses,
  };
  await fs.writeFile(outPath, JSON.stringify(data, null, 2));
  console.log(c.green(`wrote ${outPath} (${journal.length} entries, ${expenses.length} expenses)`));
}

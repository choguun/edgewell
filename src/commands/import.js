// `edgewell import` reads a JSON dump produced by `edgewell export`
// and merges the journal and expenses into the local stores. v3.0.0
// skips records that already exist (matched by `_ts` + text/amount)
// to keep the operation idempotent.

import { promises as fs } from "node:fs";
import path from "node:path";
import { c, header } from "../cli.js";

export async function importCommand(args, ew) {
  const [inPath, ...rest] = args;
  if (!inPath) {
    console.error("usage: edgewell import <file.json> [--replace]");
    process.exit(2);
  }
  const replace = rest.includes("--replace");
  const abs = path.resolve(inPath);
  header(`Importing from ${abs}`);
  const raw = await fs.readFile(abs, "utf8");
  const data = JSON.parse(raw);
  if (replace) {
    if (Array.isArray(data.journal)) {
      await ew.journal._path && (await ew.journal._reset?.());
    }
  }
  const existingJournal = await ew.journal.readAll();
  const existingExpenses = await ew.expenses.readAll();
  const jKeys = new Set(existingJournal.map((e) => `${e._ts}|${e.text}`));
  const eKeys = new Set(existingExpenses.map((e) => `${e._ts}|${e.amount}|${e.category}`));
  let addedJ = 0, addedE = 0;
  for (const e of data.journal ?? []) {
    const key = `${e._ts}|${e.text}`;
    if (jKeys.has(key)) continue;
    await ew.journal.append(e);
    jKeys.add(key);
    addedJ++;
  }
  for (const e of data.expenses ?? []) {
    const key = `${e._ts}|${e.amount}|${e.category}`;
    if (eKeys.has(key)) continue;
    await ew.expenses.append(e);
    eKeys.add(key);
    addedE++;
  }
  console.log(c.green(`imported ${addedJ} journal entries, ${addedE} expenses`));
}

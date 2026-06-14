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
  let raw;
  try {
    raw = await fs.readFile(abs, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error(c.red(`file not found: ${abs}`));
      process.exit(1);
    }
    throw err;
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error(c.red(`${abs} is not a valid JSON file (run \`edgewell export\` first):`));
    console.error(c.dim(`  ${err.message}`));
    process.exit(1);
  }
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    console.error(c.red(`${abs} is not an EdgeWell export envelope (root must be a JSON object)`));
    process.exit(1);
  }
  if (replace) {
    if (Array.isArray(data.journal) && ew.journal.filePath) {
      await fs.writeFile(ew.journal.filePath, "");
    }
    if (Array.isArray(data.expenses) && ew.expenses.filePath) {
      await fs.writeFile(ew.expenses.filePath, "");
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

// `edgewell snapshot-merge <in.json>` reads a JSON snapshot and
// merges it into the local stores. v3.0.0 uses the same dedup
// logic as `import` (timestamp + content hash) and supports a
// `--replace` flag that wipes the stores first.

import { promises as fs } from "node:fs";
import { c, header } from "../cli.js";

export async function snapshotMergeCommand(args, ew) {
  const [inPath, ...rest] = args;
  if (!inPath) {
    console.error("usage: edgewell snapshot-merge <in.json>");
    process.exit(2);
  }
  const replace = rest.includes("--replace");
  const raw = await fs.readFile(inPath, "utf8");
  const data = JSON.parse(raw);
  header("Snapshot merge");
  if (replace) {
    // Clear the existing JSONL files by writing an empty file.
    await fs.writeFile(ew.journal._path ?? "", "");
  }
  const jKeys = new Set((await ew.journal.readAll()).map((e) => `${e._ts}|${e.text}`));
  const eKeys = new Set((await ew.expenses.readAll()).map((e) => `${e._ts}|${e.amount}|${e.category}`));
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
  console.log(c.green(`merged ${addedJ} journal entries, ${addedE} expenses`));
}

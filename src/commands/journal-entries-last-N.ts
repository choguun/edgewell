// @ts-nocheck
// `edgewell journal-entries-last-N <N>` lists the last N
// entries. Sibling to `journal-entries-first-N`.

import { c } from "../cli.js";

export async function journalEntriesLastNCommand(args, ew) {
  const n = Number(args[0] ?? 5);
  if (!Number.isFinite(n) || n <= 0) {
    console.error("usage: edgewell journal-entries-last-N <N>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const slice = all.slice(-n);
  for (const e of slice) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

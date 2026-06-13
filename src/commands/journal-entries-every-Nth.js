// `edgewell journal-entries-every-Nth <N>` lists every Nth
// journal entry. v3.0.0 keeps the math in JS.

import { c } from "../cli.js";

export async function journalEntriesEveryNthCommand(args, ew) {
  const n = Number(args[0]);
  if (!Number.isFinite(n) || n < 1) {
    console.error("usage: edgewell journal-entries-every-Nth <N>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  for (let i = 0; i < all.length; i += n) {
    const e = all[i];
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

// @ts-nocheck
// `edgewell journal-entries-quartile <N>` lists the entries
// in the Nth quartile of the journal. v3.0.0 keeps the
// quartile math in JS.

import { c } from "../cli.js";

export async function journalEntriesQuartileCommand(args, ew) {
  const q = Number(args[0]);
  if (!Number.isFinite(q) || q < 1 || q > 4) {
    console.error("usage: edgewell journal-entries-quartile <1..4>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const start = Math.floor((q - 1) * all.length / 4);
  const end = Math.floor(q * all.length / 4);
  for (let i = start; i < end; i++) {
    const e = all[i];
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

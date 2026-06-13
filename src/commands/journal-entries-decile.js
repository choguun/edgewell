// `edgewell journal-entries-decile <N>` lists the entries in
// the Nth decile (1-10) of the journal. v3.0.0 keeps the
// decile math in JS.

import { c } from "../cli.js";

export async function journalEntriesDecileCommand(args, ew) {
  const d = Number(args[0]);
  if (!Number.isFinite(d) || d < 1 || d > 10) {
    console.error("usage: edgewell journal-entries-decile <1..10>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const start = Math.floor((d - 1) * all.length / 10);
  const end = Math.floor(d * all.length / 10);
  for (let i = start; i < end; i++) {
    const e = all[i];
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

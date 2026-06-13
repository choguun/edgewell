// `edgewell journal-entries-reversed` lists the journal
// entries in reverse chronological order. v3.0.0 keeps the
// sort in JS.

import { c } from "../cli.js";

export async function journalEntriesReversedCommand(args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const sorted = all.slice().sort((a, b) => (b._ts ?? "").localeCompare(a._ts ?? ""));
  for (const e of sorted) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

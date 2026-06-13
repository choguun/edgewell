// `edgewell journal-entries-first` prints the first journal
// entry. v3.0.0 keeps the lookup in JS.

import { c } from "../cli.js";

export async function journalEntriesFirstCommand(_args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const e = all[0];
  console.log(`${c.dim(e._ts)} ${e.text}`);
}

// @ts-nocheck
// `edgewell journal-entries-every-other` lists every other
// journal entry (1st, 3rd, 5th, ...). v3.0.0 keeps the
// iteration in JS.

import { c } from "../cli.js";

export async function journalEntriesEveryOtherCommand(_args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  for (let i = 0; i < all.length; i += 2) {
    const e = all[i];
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

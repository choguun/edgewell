// @ts-nocheck
// `edgewell journal-entries-odd` lists the odd-indexed
// entries (1, 3, 5, ...). v3.0.0 keeps the iteration in JS.

import { c } from "../cli.js";

export async function journalEntriesOddCommand(_args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  for (let i = 1; i < all.length; i += 2) {
    const e = all[i];
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

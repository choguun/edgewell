// @ts-nocheck
// `edgewell journal-entries-mid` prints the median journal
// entry. v3.0.0 keeps the calculation in JS.

import { c } from "../cli.js";

export async function journalEntriesMidCommand(_args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const e = all[Math.floor(all.length / 2)];
  console.log(`${c.dim(e._ts)} ${e.text}`);
}

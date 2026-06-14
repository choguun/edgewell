// @ts-nocheck
// `edgewell journal-entries-this-year` lists the journal
// entries for the current calendar year. v3.0.0 keeps the
// filter in JS.

import { c } from "../cli.js";

export async function journalEntriesThisYearCommand(_args, ew) {
  const year = new Date().toISOString().slice(0, 4);
  const all = await ew.journal.readAll();
  const matches = all.filter((e) => (e._ts ?? "").startsWith(year));
  if (matches.length === 0) {
    console.log(c.dim(`(no entries in ${year})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

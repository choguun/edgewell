// @ts-nocheck
// `edgewell journal-entries-today` lists the journal entries
// for today's date in the local timezone. v3.0.0 keeps the
// filter in JS.

import { c } from "../cli.js";

export async function journalEntriesTodayCommand(_args, ew) {
  const day = new Date().toISOString().slice(0, 10);
  const all = await ew.journal.readAll();
  const matches = all.filter((e) => (e._ts ?? "").startsWith(day));
  if (matches.length === 0) {
    console.log(c.dim("(no entries today)"));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

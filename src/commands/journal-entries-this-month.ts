// @ts-nocheck
// `edgewell journal-entries-this-month` lists the journal
// entries for the current calendar month.

import { c } from "../cli.js";

export async function journalEntriesThisMonthCommand(_args, ew) {
  const month = new Date().toISOString().slice(0, 7);
  const all = await ew.journal.readAll();
  const matches = all.filter((e) => (e._ts ?? "").startsWith(month));
  if (matches.length === 0) {
    console.log(c.dim(`(no entries in ${month})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

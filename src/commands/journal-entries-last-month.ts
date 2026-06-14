// @ts-nocheck
// `edgewell journal-entries-last-month` lists the journal
// entries for the previous calendar month. v3.0.0 keeps
// the calculation in JS.

import { c } from "../cli.js";

function previousMonth() {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 7);
}

export async function journalEntriesLastMonthCommand(_args, ew) {
  const month = previousMonth();
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

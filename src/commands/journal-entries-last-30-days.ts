// @ts-nocheck
// `edgewell journal-entries-last-30-days` lists the journal
// entries logged in the last 30 days.

import { c } from "../cli.js";

export async function journalEntriesLast30DaysCommand(_args, ew) {
  const since = Date.now() - 30 * 86400_000;
  const all = await ew.journal.readAll();
  const matches = all.filter((e) => new Date(e._ts).getTime() >= since);
  if (matches.length === 0) {
    console.log(c.dim("(no entries in the last 30 days)"));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

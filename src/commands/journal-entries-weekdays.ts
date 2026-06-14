// @ts-nocheck
// `edgewell journal-entries-weekdays` lists the journal
// entries logged on weekdays (Mon-Fri). Sibling to
// `journal-entries-weekends`.

import { c } from "../cli.js";

export async function journalEntriesWeekdaysCommand(_args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => {
    const d = new Date(e._ts).getUTCDay();
    return d >= 1 && d <= 5;
  });
  if (matches.length === 0) {
    console.log(c.dim("(no weekday entries)"));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

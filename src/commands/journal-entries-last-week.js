// `edgewell journal-entries-last-week` lists the journal
// entries logged in the last 7 days.

import { c } from "../cli.js";

export async function journalEntriesLastWeekCommand(_args, ew) {
  const since = Date.now() - 7 * 86400_000;
  const all = await ew.journal.readAll();
  const matches = all.filter((e) => new Date(e._ts).getTime() >= since);
  if (matches.length === 0) {
    console.log(c.dim("(no journal entries in the last 7 days)"));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

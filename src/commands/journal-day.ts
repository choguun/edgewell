// @ts-nocheck
// `edgewell journal-day <YYYY-MM-DD>` lists the journal entries
// logged on a specific day. v3.0.0 keeps the filter simple —
// exact prefix match on the ISO date.

import { c } from "../cli.js";

export async function journalDayCommand(args, ew) {
  const day = args[0];
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    console.error("usage: edgewell journal-day <YYYY-MM-DD>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  const matches = all.filter((e) => (e._ts ?? "").startsWith(day));
  if (matches.length === 0) {
    console.log(c.dim(`(no entries on ${day})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

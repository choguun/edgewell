// @ts-nocheck
// `edgewell journal-entries-weekends` lists the journal
// entries logged on weekends. v3.0.0 keeps the filter in JS.

import { c } from "../cli.js";

export async function journalEntriesWeekendsCommand(_args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => {
    const d = new Date(e._ts).getUTCDay();
    return d === 0 || d === 6;
  });
  if (matches.length === 0) {
    console.log(c.dim("(no weekend entries)"));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

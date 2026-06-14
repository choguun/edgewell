// @ts-nocheck
// `edgewell journal-entries-year-N <YYYY>` lists the journal
// entries logged in a specific year. v3.0.0 keeps the
// filter in JS.

import { c } from "../cli.js";

export async function journalEntriesYearNCommand(args, ew) {
  const year = String(args[0] ?? "");
  if (!/^\d{4}$/.test(year)) {
    console.error("usage: edgewell journal-entries-year-N <YYYY>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => (e._ts ?? "").startsWith(year));
  if (matches.length === 0) {
    console.log(c.dim(`(no entries in ${year})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

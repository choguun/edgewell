// `edgewell journal-entries-month-N <N>` lists the journal
// entries logged in the Nth month of any year (1-12). v3.0.0
// keeps the filter in JS.

import { c } from "../cli.js";

export async function journalEntriesMonthNCommand(args, ew) {
  const m = Number(args[0]);
  if (!Number.isFinite(m) || m < 1 || m > 12) {
    console.error("usage: edgewell journal-entries-month-N <1..12>");
    process.exit(2);
  }
  const month = String(m).padStart(2, "0");
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => (e._ts ?? "").slice(5, 7) === month);
  if (matches.length === 0) {
    console.log(c.dim(`(no entries in month ${m})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

// `edgewell journal-entries-hour-N <N>` lists the journal
// entries logged in the Nth hour of the day (0-23). v3.0.0
// keeps the filter in JS.

import { c } from "../cli.js";

export async function journalEntriesHourNCommand(args, ew) {
  const h = Number(args[0]);
  if (!Number.isFinite(h) || h < 0 || h > 23) {
    console.error("usage: edgewell journal-entries-hour-N <0..23>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => new Date(e._ts).getUTCHours() === h);
  if (matches.length === 0) {
    console.log(c.dim(`(no entries in hour ${h})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

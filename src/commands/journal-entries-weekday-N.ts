// @ts-nocheck
// `edgewell journal-entries-weekday-N <N>` lists the journal
// entries logged on the Nth weekday (0=Sun..6=Sat). v3.0.0
// keeps the filter in JS.

import { c } from "../cli.js";

const NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function journalEntriesWeekdayNCommand(args, ew) {
  const d = Number(args[0]);
  if (!Number.isFinite(d) || d < 0 || d > 6) {
    console.error("usage: edgewell journal-entries-weekday-N <0..6>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => new Date(e._ts).getUTCDay() === d);
  if (matches.length === 0) {
    console.log(c.dim(`(no entries on ${NAMES[d]})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

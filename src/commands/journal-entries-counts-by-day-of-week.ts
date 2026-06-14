// @ts-nocheck
// `edgewell journal-entries-counts-by-day-of-week` lists a
// count of journal entries grouped by day-of-week. v3.0.0
// keeps the aggregation in JS.

import { c } from "../cli.js";

const DOW_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function journalEntriesCountsByDayOfWeekCommand(args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const counts = new Array(7).fill(0);
  for (const e of all) {
    const d = new Date(e._ts);
    if (Number.isNaN(d.getTime())) continue;
    counts[d.getUTCDay()]++;
  }
  for (let i = 0; i < 7; i++) {
    console.log(`${DOW_NAMES[i]}  ${counts[i]}`);
  }
}

// `edgewell journal-entries-counts-by-hour` lists a count
// of journal entries grouped by hour-of-day. v3.0.0 keeps
// the aggregation in JS.

import { c } from "../cli.js";

export async function journalEntriesCountsByHourCommand(args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const counts = new Array(24).fill(0);
  for (const e of all) {
    const d = new Date(e._ts);
    if (Number.isNaN(d.getTime())) continue;
    counts[d.getUTCHours()]++;
  }
  for (let h = 0; h < 24; h++) {
    console.log(`${String(h).padStart(2, "0")}  ${counts[h]}`);
  }
}

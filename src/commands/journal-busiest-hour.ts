// @ts-nocheck
// `edgewell journal-busiest-hour` prints the hour of the day
// with the most journal entries. v3.0.0 keeps the aggregation
// offline.

import { c } from "../cli.js";

export async function journalBusiestHourCommand(_args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const counts = new Array(24).fill(0);
  for (const e of all) {
    const d = new Date(e._ts);
    counts[d.getUTCHours()]++;
  }
  let best = 0;
  for (let i = 1; i < 24; i++) {
    if (counts[i] > counts[best]) best = i;
  }
  console.log(`${c.bold("busiest hour:")} ${String(best).padStart(2, "0")}:00 UTC (${counts[best]} entries)`);
}

// @ts-nocheck
// `edgewell journal-stats-quick-by-weekday` is a one-line
// summary grouped by weekday. v3.0.0 keeps the aggregation
// offline.

import { c } from "../cli.js";

const NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function journalStatsQuickByWeekdayCommand(_args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const counts = new Array(7).fill(0);
  for (const e of all) {
    counts[new Date(e._ts).getUTCDay()]++;
  }
  for (let i = 0; i < 7; i++) {
    console.log(`  ${NAMES[i]}  ${counts[i]}`);
  }
}

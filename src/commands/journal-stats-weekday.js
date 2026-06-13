// `edgewell journal-stats-weekday` prints the journal entry
// count by day of the week. v3.0.0 keeps the aggregation
// offline.

import { c, header } from "../cli.js";

const NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function journalStatsWeekdayCommand(_args, ew) {
  header("Journal entries by weekday");
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const counts = new Array(7).fill(0);
  for (const e of all) {
    const d = new Date(e._ts).getUTCDay();
    counts[d]++;
  }
  for (let i = 0; i < 7; i++) {
    const bar = "#".repeat(counts[i]);
    console.log(`  ${c.cyan(NAMES[i])}  ${String(counts[i]).padStart(3)}  ${bar}`);
  }
}

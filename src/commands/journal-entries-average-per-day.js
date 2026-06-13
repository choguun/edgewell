// `edgewell journal-entries-average-per-day` reports the
// average number of entries per active day. v3.0.0 keeps
// the calculation in JS.

import { c } from "../cli.js";

function dayKey(ts) {
  return (ts ?? "").slice(0, 10);
}

export async function journalEntriesAveragePerDayCommand(_args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const days = new Set(all.map((e) => dayKey(e._ts)));
  const avg = all.length / days.size;
  console.log(avg.toFixed(2));
}

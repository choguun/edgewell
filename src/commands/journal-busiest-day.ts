// @ts-nocheck
// `edgewell journal-busiest-day` prints the day with the most
// journal entries. v3.0.0 keeps the aggregation offline.

import { c } from "../cli.js";

export async function journalBusiestDayCommand(_args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const byDay = new Map();
  for (const e of all) {
    const day = (e._ts ?? "").slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  let best = null;
  let bestCount = 0;
  for (const [day, n] of byDay) {
    if (n > bestCount) {
      best = day;
      bestCount = n;
    }
  }
  console.log(`${c.bold("busiest day:")} ${best} (${bestCount} entries)`);
}

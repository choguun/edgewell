// `edgewell journal-mood-trend` prints the average mood per
// month as an ASCII chart. v3.0.0 keeps the aggregation
// offline.

import { c, header } from "../cli.js";

export async function journalMoodTrendCommand(_args, ew) {
  header("Journal mood trend (monthly average)");
  const all = await ew.journal.readAll();
  const withMood = all.filter((e) => Number.isFinite(Number(e.mood)));
  if (withMood.length === 0) {
    console.log(c.dim("(no journal entries with a mood field)"));
    return;
  }
  const byMonth = new Map();
  for (const e of withMood) {
    const month = (e._ts ?? "").slice(0, 7);
    if (!byMonth.has(month)) byMonth.set(month, { sum: 0, count: 0 });
    const r = byMonth.get(month);
    r.sum += Number(e.mood);
    r.count++;
  }
  for (const [month, { sum, count }] of [...byMonth.entries()].sort()) {
    const avg = sum / count;
    const bar = "#".repeat(Math.max(0, Math.min(20, Math.round(avg))));
    console.log(`  ${month}  ${avg.toFixed(2).padStart(5)}  ${bar}`);
  }
}

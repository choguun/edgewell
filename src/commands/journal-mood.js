// `edgewell journal-mood` reads the `mood` field on journal
// entries and prints a histogram. v3.0.0 keeps the aggregation
// offline.

import { c, header } from "../cli.js";

export async function journalMoodCommand(_args, ew) {
  header("Journal mood histogram");
  const all = await ew.journal.readAll();
  const withMood = all.filter((e) => Number.isFinite(Number(e.mood)));
  if (withMood.length === 0) {
    console.log(c.dim("(no journal entries with a mood field)"));
    return;
  }
  const buckets = new Map();
  for (const e of withMood) {
    const m = Math.round(Number(e.mood));
    buckets.set(m, (buckets.get(m) ?? 0) + 1);
  }
  for (const [m, n] of [...buckets.entries()].sort((a, b) => a[0] - b[0])) {
    const bar = "#".repeat(Math.min(30, n));
    console.log(`  ${String(m).padStart(3)}  ${String(n).padStart(3)}  ${bar}`);
  }
}

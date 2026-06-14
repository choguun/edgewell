// @ts-nocheck
// `edgewell journal-entries-longest-streak` reports the
// longest consecutive-day streak ever. v3.0.0 keeps the
// calculation in JS.

import { c } from "../cli.js";

function dayKey(ts) {
  return (ts ?? "").slice(0, 10);
}

export async function journalEntriesLongestStreakCommand(_args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const days = [...new Set(all.map((e) => dayKey(e._ts)))].sort();
  let best = 0;
  let current = 0;
  let prev = null;
  for (const d of days) {
    if (prev) {
      const a = new Date(prev).getTime();
      const b = new Date(d).getTime();
      if (b - a === 86400_000) {
        current++;
      } else {
        current = 1;
      }
    } else {
      current = 1;
    }
    if (current > best) best = current;
    prev = d;
  }
  console.log(best);
}

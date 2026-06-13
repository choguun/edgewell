// `edgewell journal-entries-most-recent-streak` reports the
// length of the most recent consecutive-day streak of
// journal entries. v3.0.0 keeps the calculation in JS.

import { c } from "../cli.js";

function dayKey(ts) {
  return (ts ?? "").slice(0, 10);
}

export async function journalEntriesMostRecentStreakCommand(_args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const days = [...new Set(all.map((e) => dayKey(e._ts)))].sort();
  if (days.length === 0) {
    console.log(c.dim("(no logged days)"));
    return;
  }
  const last = new Date(days[days.length - 1]);
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const d = new Date(days[i]);
    const diff = Math.round((last - d) / 86400_000);
    if (diff === streak) {
      streak++;
    } else {
      break;
    }
  }
  console.log(`${c.bold("current streak:")} ${streak} days`);
}

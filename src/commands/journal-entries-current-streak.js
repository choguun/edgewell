// `edgewell journal-entries-current-streak` reports the
// current consecutive-day streak (today or yesterday
// inclusive). v3.0.0 keeps the calculation in JS.

import { c } from "../cli.js";

function dayKey(ts) {
  return (ts ?? "").slice(0, 10);
}

export async function journalEntriesCurrentStreakCommand(_args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const days = [...new Set(all.map((e) => dayKey(e._ts)))].sort();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
  let cursor;
  if (days.includes(today)) {
    cursor = today;
  } else if (days.includes(yesterday)) {
    cursor = yesterday;
  } else {
    console.log("0");
    return;
  }
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i] === cursor) {
      streak++;
      const d = new Date(cursor);
      d.setUTCDate(d.getUTCDate() - 1);
      cursor = d.toISOString().slice(0, 10);
    } else {
      break;
    }
  }
  console.log(streak);
}

// @ts-nocheck
// `edgewell journal-entries-quiet-days <N>` lists the
// longest streaks of days without a journal entry. v3.0.0
// keeps the calculation in JS.

import { c, header } from "../cli.js";

function dayKey(ts) {
  return (ts ?? "").slice(0, 10);
}

export async function journalEntriesQuietDaysCommand(_args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const days = [...new Set(all.map((e) => dayKey(e._ts)))].sort();
  if (days.length < 2) {
    console.log(c.dim("(need at least 2 distinct days)"));
    return;
  }
  const first = new Date(days[0]);
  const last = new Date(days[days.length - 1]);
  const totalDays = Math.round((last - first) / 86400_000) + 1;
  const gaps = totalDays - days.length;
  header("Journal quiet days");
  console.log(`${c.bold("logged days:")} ${days.length}`);
  console.log(`${c.bold("span:")} ${totalDays} days`);
  console.log(`${c.bold("quiet days:")} ${gaps}`);
}

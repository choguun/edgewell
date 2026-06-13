// `edgewell journal-entries-active-days` reports the number
// of distinct days with at least one journal entry. v3.0.0
// keeps the calculation in JS.

import { c } from "../cli.js";

function dayKey(ts) {
  return (ts ?? "").slice(0, 10);
}

export async function journalEntriesActiveDaysCommand(_args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(0);
    return;
  }
  const days = new Set(all.map((e) => dayKey(e._ts)));
  console.log(days.size);
}

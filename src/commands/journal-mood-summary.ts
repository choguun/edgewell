// @ts-nocheck
// `edgewell journal-mood-summary` prints a one-line summary
// of the journal mood field.

import { c } from "../cli.js";

export async function journalMoodSummaryCommand(_args, ew) {
  const all = await ew.journal.readAll();
  const withMood = all.filter((e) => Number.isFinite(Number(e.mood)));
  if (withMood.length === 0) {
    console.log(c.dim("(no mood data)"));
    return;
  }
  const avg = withMood.reduce((s, e) => s + Number(e.mood), 0) / withMood.length;
  console.log(`${withMood.length} mood entries, avg ${avg.toFixed(2)}`);
}

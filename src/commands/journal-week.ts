// @ts-nocheck
// `edgewell journal-week` lists the journal entries for the
// current ISO week. v3.0.0 keeps the calculation in JS so no
// external date library is required.

import { c } from "../cli.js";

function startOfWeek(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  return x;
}

export async function journalWeekCommand(_args, ew) {
  const start = startOfWeek(new Date()).toISOString();
  const all = await ew.journal.readAll();
  const week = all.filter((e) => e._ts >= start);
  if (week.length === 0) {
    console.log(c.dim("(no entries this week)"));
    return;
  }
  for (const e of week) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

// `edgewell journal-busiest-weekday` prints the day of the
// week with the most journal entries. v3.0.0 keeps the
// aggregation offline.

import { c } from "../cli.js";

const NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function journalBusiestWeekdayCommand(_args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const counts = new Array(7).fill(0);
  for (const e of all) {
    const d = new Date(e._ts).getUTCDay();
    counts[d]++;
  }
  let best = 0;
  for (let i = 1; i < 7; i++) {
    if (counts[i] > counts[best]) best = i;
  }
  console.log(`${c.bold("busiest weekday:")} ${NAMES[best]} (${counts[best]} entries)`);
}

// `edgewell journal-entries-counts-by-month-of-year`
// lists a count of journal entries grouped by month-of-year
// across all years. v3.0.0 keeps the aggregation in JS.

import { c } from "../cli.js";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export async function journalEntriesCountsByMonthOfYearCommand(args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const counts = new Array(12).fill(0);
  for (const e of all) {
    const m = Number((e._ts ?? "").slice(5, 7));
    if (!m || m < 1 || m > 12) continue;
    counts[m - 1]++;
  }
  for (let m = 0; m < 12; m++) {
    console.log(`${MONTH_NAMES[m]}  ${counts[m]}`);
  }
}

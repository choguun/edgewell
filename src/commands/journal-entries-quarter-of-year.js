// `edgewell journal-entries-quarter-of-year <1..4>` lists
// the journal entries for a specific quarter of the year
// across all years. v3.0.0 keeps the filter in JS.

import { c } from "../cli.js";

function quarterOfMonth(monthIdx0) {
  return Math.floor(monthIdx0 / 3) + 1; // 1..4
}

export async function journalEntriesQuarterOfYearCommand(args, ew) {
  const q = Number(args[0]);
  if (!Number.isFinite(q) || q < 1 || q > 4) {
    console.error("usage: edgewell journal-entries-quarter-of-year <1..4>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => {
    const d = new Date(e._ts);
    if (Number.isNaN(d.getTime())) return false;
    return quarterOfMonth(d.getUTCMonth()) === q;
  });
  if (matches.length === 0) {
    console.log(c.dim(`(no entries in quarter ${q})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

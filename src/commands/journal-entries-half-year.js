// `edgewell journal-entries-half-year <1|2>` lists the
// journal entries for a specific half of the year across
// all years. v3.0.0 keeps the filter in JS.

import { c } from "../cli.js";

function halfOfMonth(monthIdx0) {
  return monthIdx0 < 6 ? 1 : 2;
}

export async function journalEntriesHalfYearCommand(args, ew) {
  const h = Number(args[0]);
  if (![1, 2].includes(h)) {
    console.error("usage: edgewell journal-entries-half-year <1|2>");
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
    return halfOfMonth(d.getUTCMonth()) === h;
  });
  if (matches.length === 0) {
    console.log(c.dim(`(no entries in half-year ${h})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

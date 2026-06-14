// @ts-nocheck
// `edgewell journal-entries-week-N <N>` lists the journal
// entries in the Nth week of the current year. v3.0.0 keeps
// the filter in JS.

import { c } from "../cli.js";

function isoWeek(ts) {
  // simplified: ts is an ISO timestamp, week is 1..53
  const d = new Date(ts);
  const year = d.getUTCFullYear();
  const onejan = new Date(Date.UTC(year, 0, 1));
  const millisInDay = 86400_000;
  const dayOfYear = Math.floor((d - onejan) / millisInDay) + 1;
  return Math.ceil((dayOfYear + onejan.getUTCDay()) / 7);
}

export async function journalEntriesWeekNCommand(args, ew) {
  const week = Number(args[0]);
  if (!Number.isFinite(week) || week < 1 || week > 53) {
    console.error("usage: edgewell journal-entries-week-N <1..53>");
    process.exit(2);
  }
  const year = new Date().getUTCFullYear();
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => {
    const ts = e._ts;
    if (!ts || !ts.startsWith(String(year))) return false;
    return isoWeek(ts) === week;
  });
  if (matches.length === 0) {
    console.log(c.dim(`(no entries in week ${week} of ${year})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

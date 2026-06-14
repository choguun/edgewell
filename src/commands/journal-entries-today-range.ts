// @ts-nocheck
// `edgewell journal-entries-today-range <start-days-ago>
// <end-days-ago>` lists the journal entries between
// now-N days and now-M days. v3.0.0 keeps the range in JS.

import { c } from "../cli.js";

export async function journalEntriesTodayRangeCommand(args, ew) {
  const start = Number(args[0]);
  const end = Number(args[1]);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < end) {
    console.error("usage: edgewell journal-entries-today-range <start-days-ago> <end-days-ago>");
    process.exit(2);
  }
  const sinceStart = Date.now() - start * 86400_000;
  const sinceEnd = Date.now() - end * 86400_000;
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => {
    const t = new Date(e._ts).getTime();
    return t <= sinceStart && t > sinceEnd;
  });
  if (matches.length === 0) {
    console.log(c.dim(`(no entries between ${end} and ${start} days ago)`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

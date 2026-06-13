// `edgewell journal-entries-day-of-week <0..6>` lists the
// journal entries for a specific day of week across all data.
// 0 = Sunday, 6 = Saturday. v3.0.0 keeps the filter in JS.

import { c } from "../cli.js";

export async function journalEntriesDayOfWeekCommand(args, ew) {
  const dow = Number(args[0]);
  if (!Number.isFinite(dow) || dow < 0 || dow > 6) {
    console.error("usage: edgewell journal-entries-day-of-week <0..6>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => {
    const t = new Date(e._ts);
    if (Number.isNaN(t.getTime())) return false;
    return t.getUTCDay() === dow;
  });
  if (matches.length === 0) {
    console.log(c.dim(`(no entries on day-of-week ${dow})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

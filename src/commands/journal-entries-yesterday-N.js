// `edgewell journal-entries-yesterday-N <N>` lists the
// journal entries from yesterday, but N more days back.
// E.g. N=7 gives 8 days ago. v3.0.0 keeps the filter in JS.

import { c } from "../cli.js";

export async function journalEntriesYesterdayNCommand(args, ew) {
  const extra = Number(args[0]);
  if (!Number.isFinite(extra) || extra < 0) {
    console.error("usage: edgewell journal-entries-yesterday-N <extra-days-back>");
    process.exit(2);
  }
  const targetMs = Date.now() - (extra + 1) * 86400_000;
  const targetDay = new Date(targetMs).toISOString().slice(0, 10);
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => (e._ts ?? "").slice(0, 10) === targetDay);
  if (matches.length === 0) {
    console.log(c.dim(`(no entries on ${targetDay})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

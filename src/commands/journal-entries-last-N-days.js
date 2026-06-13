// `edgewell journal-entries-last-N-days <N>` lists the
// journal entries logged in the last N days. v3.0.0 keeps
// the filter in JS.

import { c } from "../cli.js";

export async function journalEntriesLastNDaysCommand(args, ew) {
  const n = Number(args[0]);
  if (!Number.isFinite(n) || n <= 0) {
    console.error("usage: edgewell journal-entries-last-N-days <N>");
    process.exit(2);
  }
  const since = Date.now() - n * 86400_000;
  const all = await ew.journal.readAll();
  const matches = all.filter((e) => new Date(e._ts).getTime() >= since);
  if (matches.length === 0) {
    console.log(c.dim(`(no entries in the last ${n} days)`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

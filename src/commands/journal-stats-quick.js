// `edgewell journal-stats-quick` is a one-line summary of the
// journal. v3.0.0 keeps the aggregation offline.

import { c } from "../cli.js";

export async function journalStatsQuickCommand(_args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const totalChars = all.reduce((s, e) => s + (e.text?.length ?? 0), 0);
  console.log(`${all.length} entries, ${totalChars} chars, first ${all[0]._ts.slice(0, 10)}, last ${all[all.length - 1]._ts.slice(0, 10)}`);
}

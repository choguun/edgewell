// `edgewell journal-stats-quick-detailed` is a slightly
// longer one-line summary. Sibling to `journal-stats-quick`.

import { c } from "../cli.js";

export async function journalStatsQuickDetailedCommand(_args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const totalChars = all.reduce((s, e) => s + (e.text?.length ?? 0), 0);
  const tags = new Set();
  for (const e of all) for (const t of e.tags ?? []) tags.add(t);
  console.log(`${all.length} entries, ${totalChars} chars, ${tags.size} unique tags, first ${all[0]._ts.slice(0, 10)}, last ${all[all.length - 1]._ts.slice(0, 10)}`);
}

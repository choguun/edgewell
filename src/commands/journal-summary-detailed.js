// `edgewell journal-summary-detailed` is a multi-line summary
// of the journal. v3.0.0 keeps the aggregation offline.

import { c, header } from "../cli.js";

export async function journalSummaryDetailedCommand(_args, ew) {
  header("Journal summary (detailed)");
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const totalChars = all.reduce((s, e) => s + (e.text?.length ?? 0), 0);
  const tags = new Set();
  const days = new Set();
  for (const e of all) {
    for (const t of e.tags ?? []) tags.add(t);
    days.add((e._ts ?? "").slice(0, 10));
  }
  console.log(`${c.bold("entries:")}  ${all.length}`);
  console.log(`${c.bold("total chars:")} ${totalChars}`);
  console.log(`${c.bold("avg chars:")} ${(totalChars / all.length).toFixed(1)}`);
  console.log(`${c.bold("distinct tags:")} ${tags.size}`);
  console.log(`${c.bold("distinct days:")} ${days.size}`);
  console.log(`${c.bold("first:")} ${all[0]._ts}`);
  console.log(`${c.bold("last:")} ${all[all.length - 1]._ts}`);
}

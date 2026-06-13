// `edgewell journal-summary` prints a one-paragraph prose
// summary of the journal. v3.0.0 keeps this offline — it just
// concatenates the first few entries.

import { c } from "../cli.js";

export async function journalSummaryCommand(_args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const sample = all.slice(-5).map((e) => e.text);
  console.log(`You have ${all.length} journal entries. ` +
    `Your most recent ones: ${sample.join("; ")}.`);
}

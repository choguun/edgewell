// `edgewell journal-count` prints the total number of journal
// entries plus a per-tag breakdown. v3.0.0 keeps the aggregation
// offline.

import { c, header } from "../cli.js";

export async function journalCountCommand(_args, ew) {
  header("Journal count");
  const all = await ew.journal.readAll();
  const byTag = new Map();
  for (const e of all) {
    for (const t of e.tags ?? []) {
      byTag.set(t, (byTag.get(t) ?? 0) + 1);
    }
  }
  console.log(`${c.bold("total:")} ${all.length}`);
  for (const [t, n] of [...byTag.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c.cyan(t.padEnd(16))} ${n}`);
  }
}

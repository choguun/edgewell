// @ts-nocheck
// `edgewell journal-stats` reports simple statistics over the
// journal: entry count, average length, first/last entry, and
// distribution of tags.

import { c, header } from "../cli.js";

export async function journalStatsCommand(_args, ew) {
  header("Journal statistics");
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries yet)"));
    return;
  }
  const lengths = all.map((e) => (e.text ?? "").length);
  const totalLen = lengths.reduce((a, b) => a + b, 0);
  const tagCounts = new Map();
  for (const e of all) {
    for (const t of e.tags ?? []) {
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    }
  }
  console.log(`${c.bold("count:")}     ${all.length}`);
  console.log(`${c.bold("avg len:")}  ${(totalLen / all.length).toFixed(1)} chars`);
  console.log(`${c.bold("first:")}    ${all[0]._ts}`);
  console.log(`${c.bold("last:")}     ${all[all.length - 1]._ts}`);
  if (tagCounts.size > 0) {
    console.log(c.bold("top tags:"));
    for (const [t, n] of [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
      console.log(`  ${t.padEnd(16)} ${n}`);
    }
  }
}

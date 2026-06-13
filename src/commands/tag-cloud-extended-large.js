// `edgewell tag-cloud-extended-large` is the wide variant of
// the extended tag cloud. v3.0.0 keeps the rendering offline.

import { c, header } from "../cli.js";

export async function tagCloudExtendedLargeCommand(_args, ew) {
  header("Tag cloud (extended, large)");
  const all = await ew.journal.readAll();
  const counts = new Map();
  for (const e of all) {
    for (const t of e.tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  if (counts.size === 0) {
    console.log(c.dim("(no tagged entries)"));
    return;
  }
  const max = Math.max(...counts.values());
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [t, n] of sorted) {
    const factor = Math.max(1, Math.round((n / max) * 20));
    const bar = "#".repeat(factor);
    console.log(`  ${c.cyan(t.padEnd(16))} ${bar} ${n}`);
  }
}

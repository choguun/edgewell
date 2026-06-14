// @ts-nocheck
// `edgewell tag-cloud-large` renders the full tag cloud
// (no limit). v3.0.0 keeps the rendering offline.

import { c, header } from "../cli.js";

export async function tagCloudLargeCommand(_args, ew) {
  header("Tag cloud (large)");
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
  const sorted = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [tag, n] of sorted) {
    const factor = Math.max(1, Math.round((n / max) * 10));
    const bar = "#".repeat(factor);
    console.log(`  ${c.cyan(tag.padEnd(16))} ${bar} ${n}`);
  }
}

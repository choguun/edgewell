// `edgewell tag-cloud` renders the most common tags as an ASCII
// cloud, where each tag is repeated `count` times. Handy for a
// quick visual scan of what the user is writing about.

import { c, header } from "../cli.js";

export async function tagCloudCommand(_args, ew) {
  header("Tag cloud");
  const all = await ew.journal.readAll();
  const counts = new Map();
  for (const e of all) {
    for (const t of e.tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  if (counts.size === 0) {
    console.log(c.dim("(no tagged journal entries yet)"));
    return;
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30);
  const max = Math.max(...sorted.map(([, n]) => n));
  for (const [tag, n] of sorted) {
    const factor = Math.max(1, Math.round((n / max) * 5));
    const bars = "#".repeat(factor);
    console.log(`  ${c.cyan(tag.padEnd(16))} ${bars} ${n}`);
  }
}

// `edgewell tag-rare [N]` lists the N least-frequent tags.
// Sibling to `tag-cloud` and `tag-rank`.

import { c, header } from "../cli.js";

export async function tagRareCommand(args, ew) {
  const n = Number(args[0] ?? 5);
  if (!Number.isFinite(n) || n <= 0) {
    console.error("usage: edgewell tag-rare [N]");
    process.exit(2);
  }
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
  const sorted = [...counts.entries()].sort((a, b) => a[1] - b[1]).slice(0, n);
  header(`Rarest ${n} tags`);
  for (const [t, n] of sorted) console.log(`  ${c.cyan(t)} (${n})`);
}

// `edgewell tags` aggregates tags across journal entries and prints
// the most common ones. Tags live in journal records as `tags: [...]`.

import { c } from "../cli.js";

export async function tagsCommand(args, ew) {
  const all = await ew.journal.readAll();
  const counts = new Map();
  for (const e of all) {
    for (const t of e.tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    console.log(c.dim("(no tagged journal entries yet)"));
    return;
  }
  for (const [t, n] of sorted) {
    console.log(`${String(n).padStart(4)}  ${t}`);
  }
}

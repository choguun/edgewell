// @ts-nocheck
// `edgewell tag-orphans` lists tags that have only one journal
// entry. v3.0.0 keeps this offline; useful for cleaning up
// the tag vocabulary.

import { c, header } from "../cli.js";

export async function tagOrphansCommand(_args, ew) {
  header("Tag orphans (count=1)");
  const all = await ew.journal.readAll();
  const counts = new Map();
  for (const e of all) {
    for (const t of e.tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  const orphans = [...counts.entries()].filter(([, n]) => n === 1).sort();
  if (orphans.length === 0) {
    console.log(c.green("(no orphan tags)"));
    return;
  }
  for (const [t] of orphans) console.log(`  ${c.cyan(t)}`);
  console.log(c.dim(`(${orphans.length} orphan tags)`));
}

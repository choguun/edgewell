// `edgewell tag-search <pattern>` searches the tag vocabulary
// (and the tags used in the journal) for a substring match.
// v3.0.0 keeps this offline.

import { c } from "../cli.js";

export async function tagSearchCommand(args, ew) {
  const pattern = (args[0] ?? "").toLowerCase();
  if (!pattern) {
    console.error("usage: edgewell tag-search <pattern>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  const used = new Set();
  for (const e of all) for (const t of e.tags ?? []) used.add(t);
  const matches = [...used].filter((t) => t.toLowerCase().includes(pattern));
  if (matches.length === 0) {
    console.log(c.dim("(no matches)"));
    return;
  }
  for (const t of matches.sort()) console.log(t);
}

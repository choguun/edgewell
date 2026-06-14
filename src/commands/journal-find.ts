// @ts-nocheck
// `edgewell journal-find <tag>` lists journal entries that carry
// the given tag. Useful for browsing a slice of the journal.

import { c } from "../cli.js";

export async function journalFindCommand(args, ew) {
  const tag = args[0];
  if (!tag) {
    console.error("usage: edgewell journal-find <tag>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  const matches = all.filter((e) => (e.tags ?? []).includes(tag));
  if (matches.length === 0) {
    console.log(c.dim(`(no entries tagged "${tag}")`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

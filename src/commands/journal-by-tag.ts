// @ts-nocheck
// `edgewell journal-by-tag <tag>` lists journal entries that
// carry the given tag. Sibling to `tags` which lists the tag
// counts.

import { c } from "../cli.js";

export async function journalByTagCommand(args, ew) {
  const tag = args[0];
  if (!tag) {
    console.error("usage: edgewell journal-by-tag <tag>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  const matches = all.filter((e) => (e.tags ?? []).includes(tag));
  if (matches.length === 0) {
    console.log(c.dim(`(no entries with tag "${tag}")`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

// @ts-nocheck
// `edgewell journal-entries-starts-with <prefix>` lists the
// journal entries whose text starts with a prefix. v3.0.0
// keeps the filter in JS.

import { c } from "../cli.js";

export async function journalEntriesStartsWithCommand(args, ew) {
  const prefix = String(args[0] ?? "");
  if (!prefix) {
    console.error("usage: edgewell journal-entries-starts-with <prefix>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => String(e.text ?? "").toLowerCase().startsWith(prefix.toLowerCase()));
  if (matches.length === 0) {
    console.log(c.dim(`(no entries starting with "${prefix}")`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

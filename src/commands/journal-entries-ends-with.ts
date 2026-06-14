// @ts-nocheck
// `edgewell journal-entries-ends-with <suffix>` lists the
// journal entries whose text ends with a suffix. v3.0.0
// keeps the filter in JS.

import { c } from "../cli.js";

export async function journalEntriesEndsWithCommand(args, ew) {
  const suffix = String(args[0] ?? "");
  if (!suffix) {
    console.error("usage: edgewell journal-entries-ends-with <suffix>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => String(e.text ?? "").toLowerCase().endsWith(suffix.toLowerCase()));
  if (matches.length === 0) {
    console.log(c.dim(`(no entries ending with "${suffix}")`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

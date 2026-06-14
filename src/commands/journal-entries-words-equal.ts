// @ts-nocheck
// `edgewell journal-entries-words-equal <N>` lists the
// journal entries whose word count is exactly N. v3.0.0
// keeps the filter in JS.

import { c } from "../cli.js";

function wordCount(s) {
  const t = String(s ?? "").trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

export async function journalEntriesWordsEqualCommand(args, ew) {
  const n = Number(args[0]);
  if (!Number.isFinite(n) || n < 0) {
    console.error("usage: edgewell journal-entries-words-equal <N>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => wordCount(e.text) === n);
  if (matches.length === 0) {
    console.log(c.dim(`(no entries with exactly ${n} words)`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

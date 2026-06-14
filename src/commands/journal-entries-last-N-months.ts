// @ts-nocheck
// `edgewell journal-entries-last-N-months <N>` lists the
// journal entries from the last N months. v3.0.0 keeps the
// filter in JS.

import { c } from "../cli.js";

export async function journalEntriesLastNMonthsCommand(args, ew) {
  const N = Number(args[0]);
  if (!Number.isFinite(N) || N < 1) {
    console.error("usage: edgewell journal-entries-last-N-months <N>");
    process.exit(2);
  }
  const cutoffMs = Date.now() - N * 30 * 86400_000;
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => {
    const t = new Date(e._ts).getTime();
    return t >= cutoffMs;
  });
  if (matches.length === 0) {
    console.log(c.dim(`(no entries in the last ${N} months)`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

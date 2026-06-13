// `edgewell tag-recent [N]` lists the N most recent tags used
// in the journal. v3.0.0 keeps the iteration in JS.

import { c } from "../cli.js";

export async function tagRecentCommand(args, ew) {
  const n = Number(args[0] ?? 10);
  if (!Number.isFinite(n) || n <= 0) {
    console.error("usage: edgewell tag-recent [N]");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const seen = [];
  for (let i = all.length - 1; i >= 0 && seen.length < n; i--) {
    for (const t of all[i].tags ?? []) {
      if (!seen.includes(t)) seen.push(t);
      if (seen.length >= n) break;
    }
  }
  console.log(seen.join(" "));
}

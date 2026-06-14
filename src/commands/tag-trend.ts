// @ts-nocheck
// `edgewell tag-trend <tag>` prints the count of a given tag
// per month, oldest first. v3.0.0 keeps the aggregation offline.

import { c, header } from "../cli.js";

export async function tagTrendCommand(args, ew) {
  const tag = args[0];
  if (!tag) {
    console.error("usage: edgewell tag-trend <tag>");
    process.exit(2);
  }
  header(`Tag trend: ${tag}`);
  const all = await ew.journal.readAll();
  const byMonth = new Map();
  for (const e of all) {
    if ((e.tags ?? []).includes(tag)) {
      const month = (e._ts ?? "").slice(0, 7);
      byMonth.set(month, (byMonth.get(month) ?? 0) + 1);
    }
  }
  if (byMonth.size === 0) {
    console.log(c.dim(`(no entries with tag "${tag}")`));
    return;
  }
  for (const [month, n] of [...byMonth.entries()].sort()) {
    const bar = "#".repeat(Math.min(20, n));
    console.log(`  ${month}  ${String(n).padStart(3)} ${bar}`);
  }
}

// @ts-nocheck
// `edgewell tag-stats` prints a richer view of journal tags than
// the simple `tags` command: count, first-seen, last-seen, and the
// longest entry carrying each tag.

import { c, header } from "../cli.js";

export async function tagStatsCommand(_args, ew) {
  header("Tag statistics");
  const all = await ew.journal.readAll();
  const byTag = new Map();
  for (let i = 0; i < all.length; i++) {
    const e = all[i];
    for (const t of e.tags ?? []) {
      let rec = byTag.get(t);
      if (!rec) {
        rec = { count: 0, first: e._ts, last: e._ts, longest: "" };
        byTag.set(t, rec);
      }
      rec.count++;
      if (e._ts < rec.first) rec.first = e._ts;
      if (e._ts > rec.last) rec.last = e._ts;
      if ((e.text?.length ?? 0) > rec.longest.length) rec.longest = e.text ?? "";
    }
  }
  if (byTag.size === 0) {
    console.log(c.dim("(no tagged journal entries yet)"));
    return;
  }
  const sorted = [...byTag.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [tag, rec] of sorted) {
    console.log(`${c.cyan(tag.padEnd(16))} n=${String(rec.count).padEnd(4)} first=${rec.first.slice(0, 10)} last=${rec.last.slice(0, 10)}`);
  }
}

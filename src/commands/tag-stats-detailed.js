// `edgewell tag-stats-detailed` is a richer version of
// `tag-stats` that includes the longest and shortest entry
// per tag. v3.0.0 keeps the aggregation offline.

import { c, header } from "../cli.js";

export async function tagStatsDetailedCommand(_args, ew) {
  header("Tag stats (detailed)");
  const all = await ew.journal.readAll();
  const byTag = new Map();
  for (const e of all) {
    for (const t of e.tags ?? []) {
      let rec = byTag.get(t);
      if (!rec) {
        rec = { count: 0, first: e._ts, last: e._ts, longest: "", shortest: "" };
        byTag.set(t, rec);
      }
      rec.count++;
      if (e._ts < rec.first) rec.first = e._ts;
      if (e._ts > rec.last) rec.last = e._ts;
      const t1 = e.text ?? "";
      if (t1.length > rec.longest.length) rec.longest = t1;
      if (rec.shortest === "" || t1.length < rec.shortest.length) rec.shortest = t1;
    }
  }
  if (byTag.size === 0) {
    console.log(c.dim("(no tagged entries)"));
    return;
  }
  const sorted = [...byTag.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [tag, rec] of sorted) {
    console.log(`  ${c.cyan(tag.padEnd(16))} n=${String(rec.count).padEnd(4)} longest=${rec.longest.length}c shortest=${rec.shortest.length}c`);
  }
}

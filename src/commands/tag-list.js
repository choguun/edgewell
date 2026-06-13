// `edgewell tag-list` is a sibling to `tags` that prints a
// longer per-tag view (count, first, last). Same as `tag-stats`
// but renamed for symmetry with `tag-delete` and `tag-rename`.

import { c, header } from "../cli.js";

export async function tagListCommand(_args, ew) {
  header("Tag list");
  const all = await ew.journal.readAll();
  const byTag = new Map();
  for (const e of all) {
    for (const t of e.tags ?? []) {
      let rec = byTag.get(t);
      if (!rec) {
        rec = { count: 0, first: e._ts, last: e._ts };
        byTag.set(t, rec);
      }
      rec.count++;
      if (e._ts < rec.first) rec.first = e._ts;
      if (e._ts > rec.last) rec.last = e._ts;
    }
  }
  if (byTag.size === 0) {
    console.log(c.dim("(no tagged journal entries yet)"));
    return;
  }
  const sorted = [...byTag.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [tag, rec] of sorted) {
    console.log(`  ${c.cyan(tag.padEnd(16))} n=${String(rec.count).padEnd(4)} ${rec.first.slice(0, 10)} → ${rec.last.slice(0, 10)}`);
  }
}

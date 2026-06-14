// @ts-nocheck
// `edgewell retag <from> <to>` rewrites every journal entry that
// uses the `from` tag to use the `to` tag. v3.0.0 keeps the rename
// append-only: each affected entry gets a new row with the new
// tag and a `renamedFrom` audit field.

import { c } from "../cli.js";

export async function retagCommand(args, ew) {
  const [from, to] = args;
  if (!from || !to) {
    console.error("usage: edgewell retag <from> <to>");
    process.exit(2);
  }
  if (from === to) {
    console.log(c.yellow("from and to are the same; nothing to do"));
    return;
  }
  const all = await ew.journal.readAll();
  let n = 0;
  for (let i = 0; i < all.length; i++) {
    const e = all[i];
    if ((e.tags ?? []).includes(from)) {
      const newTags = Array.from(new Set([...(e.tags ?? []).filter((t) => t !== from), to]));
      await ew.journal.append({ kind: "journal", _ts: e._ts, text: e.text, tags: newTags, renamedFrom: from, renamedTo: to });
      n++;
    }
  }
  console.log(c.green(`retagged ${n} entries`));
}

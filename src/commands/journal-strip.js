// `edgewell journal-strip` removes a tag from every journal entry
// that uses it. v3.0.0 keeps the operation append-only: each
// affected entry gets a new row with the tag removed and an audit
// field.

import { c } from "../cli.js";

export async function journalStripCommand(args, ew) {
  const tag = args[0];
  if (!tag) {
    console.error("usage: edgewell journal-strip <tag>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  let n = 0;
  for (let i = 0; i < all.length; i++) {
    const e = all[i];
    if ((e.tags ?? []).includes(tag)) {
      const newTags = (e.tags ?? []).filter((t) => t !== tag);
      await ew.journal.append({ _ts: e._ts, text: e.text, tags: newTags, strippedTag: tag });
      n++;
    }
  }
  console.log(c.green(`stripped "${tag}" from ${n} entries`));
}

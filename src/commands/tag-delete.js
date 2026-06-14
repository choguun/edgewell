// `edgewell tag-delete <tag>` removes a tag from every journal
// entry that uses it. v3.0.0 keeps the operation append-only: each
// affected entry gets a new row without the tag. Same as
// `journal-strip <tag>` but more discoverable.

import { c } from "../cli.js";

export async function tagDeleteCommand(args, ew) {
  const tag = args[0];
  if (!tag) {
    console.error("usage: edgewell tag-delete <tag>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  let n = 0;
  for (let i = 0; i < all.length; i++) {
    const e = all[i];
    if ((e.tags ?? []).includes(tag)) {
      const newTags = (e.tags ?? []).filter((t) => t !== tag);
      await ew.journal.append({ kind: "journal", _ts: e._ts, text: e.text, tags: newTags, tagDeleted: tag });
      n++;
    }
  }
  console.log(c.green(`deleted "${tag}" from ${n} entries`));
}

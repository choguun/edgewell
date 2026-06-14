// `edgewell tag-rm <id> <tag>` removes a tag from a specific
// journal entry. v3.0.0 keeps the operation append-only by
// writing a new entry without the offending tag.

import { c } from "../cli.js";

export async function tagRmCommand(args, ew) {
  const [idStr, ...tagParts] = args;
  const tag = tagParts.join(" ").trim();
  const id = Number(idStr);
  if (!Number.isFinite(id) || !tag) {
    console.error("usage: edgewell tag-rm <id> <tag>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (id < 0 || id >= all.length) {
    console.error(`id ${id} out of range (0..${all.length - 1})`);
    process.exit(2);
  }
  const entry = all[id];
  const newTags = (entry.tags ?? []).filter((t) => t !== tag);
  await ew.journal.append({ kind: "journal", _ts: new Date().toISOString(), text: entry.text, tags: newTags, tagRemoved: tag });
  console.log(c.green(`removed "${tag}" from entry ${id}`));
}

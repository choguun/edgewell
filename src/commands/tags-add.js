// `edgewell tags-add <id> <tag>` appends a tag to a specific
// journal entry. v3.0.0 matches entries by ordinal id (the row
// number in the JSONL file) since there is no natural key.

export async function tagsAddCommand(args, ew) {
  const [idStr, ...tagParts] = args;
  const tag = tagParts.join(" ").trim();
  const id = Number(idStr);
  if (!Number.isFinite(id) || !tag) {
    console.error("usage: edgewell tags-add <id> <tag>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (id < 0 || id >= all.length) {
    console.error(`id ${id} out of range (0..${all.length - 1})`);
    process.exit(2);
  }
  const entry = all[id];
  const tags = Array.from(new Set([...(entry.tags ?? []), tag]));
  // JsonlStore is append-only, so we just append a new entry that
  // records the change in a small audit shape.
  await ew.journal.append({ _ts: new Date().toISOString(), text: entry.text, tags, tagAdded: tag });
  console.log(`tagged entry ${id} with "${tag}"`);
}

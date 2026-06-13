// `edgewell entry-show <id>` prints a single journal entry by
// ordinal id. Sibling to `journal-find` (which filters by tag)
// and `head` / `tail` (which slice from the ends).

import { c } from "../cli.js";

export async function entryShowCommand(args, ew) {
  const id = Number(args[0]);
  if (!Number.isFinite(id)) {
    console.error("usage: edgewell entry-show <id>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (id < 0 || id >= all.length) {
    console.error(`id ${id} out of range (0..${all.length - 1})`);
    process.exit(2);
  }
  const e = all[id];
  console.log(`${c.dim("id:")}     ${id}`);
  console.log(`${c.dim("ts:")}      ${e._ts}`);
  console.log(`${c.dim("text:")}    ${e.text}`);
  if (e.tags?.length) console.log(`${c.dim("tags:")}    ${e.tags.join(", ")}`);
  if (e.mood) console.log(`${c.dim("mood:")}    ${e.mood}`);
}

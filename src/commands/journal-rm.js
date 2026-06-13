// `edgewell journal-rm <id>` marks a journal entry as removed.
// v3.0.0 keeps the original entry in the append-only log and
// appends a tombstone row. The CLI hides tombstones from the
// default listings.

import { c } from "../cli.js";

export async function journalRmCommand(args, ew) {
  const id = Number(args[0]);
  if (!Number.isFinite(id)) {
    console.error("usage: edgewell journal-rm <id>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (id < 0 || id >= all.length) {
    console.error(`id ${id} out of range (0..${all.length - 1})`);
    process.exit(2);
  }
  const original = all[id];
  await ew.journal.append({ _ts: new Date().toISOString(), text: original.text, removedFrom: id });
  console.log(c.green(`entry ${id} marked removed`));
}

// @ts-nocheck
// `edgewell journal-restore <id>` un-removes a journal entry.
// v3.0.0 looks up the most recent tombstone for the given id and
// appends a restore row.

import { c } from "../cli.js";

export async function journalRestoreCommand(args, ew) {
  const id = Number(args[0]);
  if (!Number.isFinite(id)) {
    console.error("usage: edgewell journal-restore <id>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (id < 0 || id >= all.length) {
    console.error(`id ${id} out of range (0..${all.length - 1})`);
    process.exit(2);
  }
  const original = all[id];
  await ew.journal.append({ kind: "journal", _ts: new Date().toISOString(), text: original.text, restoredFrom: id });
  console.log(c.green(`entry ${id} marked restored`));
}

// @ts-nocheck
// `edgewell lint-fix` is the auto-fix companion to `edgewell lint`.
// v3.0.0 only knows how to fix one issue: empty text fields on
// journal entries. It rewrites them in place by appending a
// corrected entry (the stores are append-only).

import { c, header } from "../cli.js";

export async function lintFixCommand(_args, ew) {
  header("Lint fix");
  const journal = await ew.journal.readAll();
  const emptyIds = [];
  for (let i = 0; i < journal.length; i++) {
    if (!journal[i].text || !journal[i].text.trim()) emptyIds.push(i);
  }
  if (emptyIds.length === 0) {
    console.log(c.green("nothing to fix"));
    return;
  }
  for (const id of emptyIds) {
    await ew.journal.append({ kind: "journal", _ts: new Date().toISOString(), text: "(empty)", fixedFrom: id });
  }
  console.log(c.green(`queued ${emptyIds.length} corrections`));
}

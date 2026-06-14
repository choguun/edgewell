// @ts-nocheck
// `edgewell journal-empty` lists the journal entries with an
// empty or missing `text` field. v3.0.0 keeps the iteration
// in JS.

import { c } from "../cli.js";

export async function journalEmptyCommand(_args, ew) {
  const all = await ew.journal.readAll();
  const empties = all
    .map((e, i) => ({ id: i, e }))
    .filter(({ e }) => !e.text || !String(e.text).trim());
  if (empties.length === 0) {
    console.log(c.green("(no empty entries)"));
    return;
  }
  for (const { id, e } of empties) {
    console.log(`${c.dim(`#${id}`)} ${e._ts}`);
  }
  console.log(c.dim(`(${empties.length} empty entries)`));
}

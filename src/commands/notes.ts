// @ts-nocheck
// `edgewell notes` lists free-form notes attached to the journal.
// v3.0.0 treats every journal entry with a `note` tag as a free-
// form note. This is a thin view over the existing store.

import { c } from "../cli.js";

export async function notesCommand(_args, ew) {
  const all = await ew.journal.readAll();
  const notes = all.filter((e) => (e.tags ?? []).includes("note"));
  if (notes.length === 0) {
    console.log(c.dim("(no notes yet — add one with: edgewell journal add \"...\" --tag note)"));
    return;
  }
  for (const n of notes) {
    console.log(`${c.dim(n._ts)} ${n.text}`);
  }
}

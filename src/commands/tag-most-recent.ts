// @ts-nocheck
// `edgewell tag-most-recent` lists the tags of the most recent
// journal entry. v3.0.0 keeps the implementation trivial.

import { c } from "../cli.js";

export async function tagMostRecentCommand(_args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const last = all[all.length - 1];
  const tags = last.tags ?? [];
  if (tags.length === 0) {
    console.log(c.dim(`(entry ${all.length - 1} has no tags)`));
    return;
  }
  console.log(tags.join(" "));
}

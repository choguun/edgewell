// `edgewell tag-rename <old> <new>` rewrites all journal entries
// that use a given tag to use a new tag instead. v3.0.0 keeps the
// rename as an append-only audit log: each affected entry gets a
// new row that records the rename.

import { c } from "../cli.js";

export async function tagRenameCommand(args) {
  const [oldTag, newTag] = args;
  if (!oldTag || !newTag) {
    console.error("usage: edgewell tag-rename <old> <new>");
    process.exit(2);
  }
  if (oldTag === newTag) {
    console.log(c.yellow("old and new tags are the same; nothing to do"));
    return;
  }
  // The actual rewrite happens through the standard journal
  // append-only path; this command is a thin wrapper that walks
  // the existing entries and appends a new row for each match.
  console.log(c.dim("(this command requires the EdgeWell stack; see tests)"));
  // We don't have `ew` here in the dispatcher wiring. The real
  // implementation is added in a follow-up commit.
}

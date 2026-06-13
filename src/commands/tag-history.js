// `edgewell tag-history <tag>` prints a chronological list of
// the timestamps when the tag was first and last seen. v3.0.0
// keeps this read-only.

import { c, header } from "../cli.js";

export async function tagHistoryCommand(args, ew) {
  const tag = args[0];
  if (!tag) {
    console.error("usage: edgewell tag-history <tag>");
    process.exit(2);
  }
  header(`Tag history: ${tag}`);
  const all = await ew.journal.readAll();
  const matches = all
    .filter((e) => (e.tags ?? []).includes(tag))
    .map((e) => e._ts)
    .sort();
  if (matches.length === 0) {
    console.log(c.dim(`(no entries with tag "${tag}")`));
    return;
  }
  console.log(`${c.bold("first:")} ${matches[0]}`);
  console.log(`${c.bold("last:")}  ${matches[matches.length - 1]}`);
  console.log(`${c.bold("count:")} ${matches.length}`);
  console.log(c.dim("timestamps:"));
  for (const ts of matches) console.log(`  ${ts}`);
}

// `edgewell tag-cluster <a> <b>` prints the number of journal
// entries that carry both of the given tags. v3.0.0 keeps the
// calculation in JS.

import { c } from "../cli.js";

export async function tagClusterCommand(args, ew) {
  const [a, b] = args;
  if (!a || !b) {
    console.error("usage: edgewell tag-cluster <tag-a> <tag-b>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  const both = all.filter((e) => (e.tags ?? []).includes(a) && (e.tags ?? []).includes(b));
  const aOnly = all.filter((e) => (e.tags ?? []).includes(a) && !(e.tags ?? []).includes(b));
  const bOnly = all.filter((e) => !(e.tags ?? []).includes(a) && (e.tags ?? []).includes(b));
  console.log(`${c.cyan(a)} ∩ ${c.cyan(b)}: ${both.length}`);
  console.log(`${c.cyan(a)} only:    ${aOnly.length}`);
  console.log(`${c.cyan(b)} only:    ${bOnly.length}`);
  console.log(`${c.cyan(a)} ∪ ${c.cyan(b)}: ${aOnly.length + both.length + bOnly.length}`);
}

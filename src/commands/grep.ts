// @ts-nocheck
// `edgewell grep <pattern>` filters journal entries by a
// case-insensitive substring. v3.0.0 keeps this simple — no
// regex, just substring matching — so the offline test suite
// stays green.

import { c } from "../cli.js";

export async function grepCommand(args, ew) {
  const pattern = args.join(" ").trim().toLowerCase();
  if (!pattern) {
    console.error("usage: edgewell grep <pattern>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  let n = 0;
  for (const e of all) {
    if ((e.text ?? "").toLowerCase().includes(pattern)) {
      const tags = e.tags?.length ? ` ${c.dim(`[${e.tags.join(", ")}]`)}` : "";
      console.log(`${c.dim(e._ts)} ${e.text}${tags}`);
      n++;
    }
  }
  if (n === 0) console.log(c.dim("(no matches)"));
}

// @ts-nocheck
// `edgewell headlines` returns a single line per recent journal
// entry, trimmed to a configurable width. v3.0.0 keeps the
// trimming naive (slice on a word boundary) so the offline test
// suite stays green.

import { c } from "../cli.js";

function trim(s, width) {
  if (s.length <= width) return s;
  const cut = s.slice(0, width);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > width * 0.6 ? cut.slice(0, lastSpace) : cut) + "…";
}

export async function headlinesCommand(args, ew) {
  const width = Number(args[0] ?? 80);
  if (!Number.isFinite(width) || width < 20) {
    console.error("usage: edgewell headlines [width]");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no entries)"));
    return;
  }
  for (const e of all.slice(-10)) {
    const head = trim(e.text ?? "", width);
    console.log(`${c.dim(e._ts.slice(0, 10))} ${head}`);
  }
}

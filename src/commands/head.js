// `edgewell head [N]` shows the first N journal entries
// (default 10). Sibling to `tail`.

import { c } from "../cli.js";

export async function headCommand(args, ew) {
  const n = Number(args[0] ?? 10);
  if (!Number.isFinite(n) || n <= 0) {
    console.error("usage: edgewell head [N]");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  const slice = all.slice(0, n);
  for (const e of slice) {
    const tags = e.tags?.length ? ` ${c.dim(`[${e.tags.join(", ")}]`)}` : "";
    console.log(`${c.dim(e._ts)} ${e.text}${tags}`);
  }
}

// `edgewell journal-tags` lists the tags of the most recent N
// journal entries. v3.0.0 keeps this offline.

import { c } from "../cli.js";

export async function journalTagsCommand(args, ew) {
  const n = Number(args[0] ?? 5);
  if (!Number.isFinite(n) || n <= 0) {
    console.error("usage: edgewell journal-tags [N]");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  const recent = all.slice(-n);
  for (const e of recent) {
    const tags = e.tags?.length ? e.tags.join(", ") : "(none)";
    console.log(`${c.dim(e._ts)} ${tags}`);
  }
}

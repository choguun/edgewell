// `edgewell journal-entries-regex <pattern>` lists the
// journal entries whose text matches a regex. v3.0.0 keeps
// the filter in JS.

import { c } from "../cli.js";

export async function journalEntriesRegexCommand(args, ew) {
  const pattern = String(args[0] ?? "");
  if (!pattern) {
    console.error("usage: edgewell journal-entries-regex <pattern>");
    process.exit(2);
  }
  let re;
  try {
    re = new RegExp(pattern, "i");
  } catch (e) {
    console.error(`invalid regex: ${e.message}`);
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => re.test(String(e.text ?? "")));
  if (matches.length === 0) {
    console.log(c.dim(`(no entries matching /${pattern}/i)`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}

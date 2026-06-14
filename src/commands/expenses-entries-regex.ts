// @ts-nocheck
// `edgewell expenses-entries-regex <pattern>` lists the
// expenses whose category matches a regex.

import { c } from "../cli.js";

export async function expensesEntriesRegexCommand(args, ew) {
  const pattern = String(args[0] ?? "");
  if (!pattern) {
    console.error("usage: edgewell expenses-entries-regex <pattern>");
    process.exit(2);
  }
  let re;
  try {
    re = new RegExp(pattern, "i");
  } catch (e) {
    console.error(`invalid regex: ${e.message}`);
    process.exit(2);
  }
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const matches = all.filter((e) => re.test(String(e.category ?? "")));
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses matching /${pattern}/i)`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}

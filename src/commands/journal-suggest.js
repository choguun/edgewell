// `edgewell journal-suggest <text>` suggests tags for a new
// journal entry. Sibling to `tag-suggest` but with a friendlier
// "what should I tag this as?" framing.

import { tagSuggestCommand } from "./tag-suggest.js";
import { c } from "../cli.js";

export async function journalSuggestCommand(args) {
  const text = args.join(" ");
  if (!text) {
    console.error("usage: edgewell journal-suggest <text>");
    process.exit(2);
  }
  console.log(c.dim("suggested tags:"));
  await tagSuggestCommand(args);
}

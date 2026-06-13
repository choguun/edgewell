// `edgewell snippet <name>` renders a named snippet template from
// the v3.0.0 prompt library. Useful for one-shot testing without
// having to load the full agent stack.

import { renderTemplate } from "../prompts.js";
import { c } from "../cli.js";

export async function snippetCommand(args) {
  const [name, ...rest] = args;
  if (!name) {
    console.error("usage: edgewell snippet <health|finance|sleep> [text...]");
    process.exit(2);
  }
  const question = rest.join(" ") || "What should I focus on this week?";
  try {
    const out = renderTemplate(name, { question });
    console.log(out);
    console.log(c.dim("\n--- rendered with question:"));
    console.log(c.dim(question));
  } catch (err) {
    console.error(c.red(err.message));
    process.exit(1);
  }
}

// `edgewell prompt <agent> <text>` renders a v3.0.0 agent prompt
// using the prompt template library. Useful for inspecting what
// the LLM will see without actually loading a model.

import { renderTemplate } from "../prompts.js";
import { c } from "../cli.js";

export async function promptCommand(args) {
  const [agent, ...rest] = args;
  if (!agent) {
    console.error("usage: edgewell prompt <agent> <text>");
    process.exit(2);
  }
  const text = rest.join(" ") || "What should I focus on this week?";
  try {
    const out = renderTemplate(agent, { question: text });
    console.log(out);
  } catch (err) {
    console.error(c.red(err.message));
    process.exit(1);
  }
}

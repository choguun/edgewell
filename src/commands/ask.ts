// @ts-nocheck
import { c } from "../cli.js";

export async function askCommand(args, ew) {
  const q = args.join(" ").trim();
  if (!q) {
    console.error("question cannot be empty");
    console.error("usage: edgewell ask \"<question>\"");
    process.exit(2);
  }
  // Detect stub mode: when @qvac/sdk is not installed (offline
  // dev / CI), the orchestrator returns prompts that include the
  // full RAG context, the user prompt, and the agent template
  // before a "[stub completion]" placeholder. That's noisy for
  // an interactive user (UAT-FN-12). In stub mode, suppress the
  // internal prompt and show a clean one-liner.
  const stubbed = process.env.EDGEWELL_OFFLINE === "1" || !hasSdk();
  if (stubbed) {
    const { agent } = await ew.orchestrator.route(q);
    console.log(c.dim(`[${agent}]`));
    console.log(c.cyan(`[stub] no @qvac/sdk installed — would have answered: "${q}"`));
    return;
  }
  const { agent, reply } = await ew.orchestrator.ask(q);
  console.log(c.dim(`[${agent}]`));
  console.log(reply);
}

function hasSdk() {
  try {
    // Same approach as EdgeWellLLM._ensureSdk. The require is
    // synchronous so we can cheaply decide whether to show the
    // stub one-liner before running the full orchestrator.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require.resolve("@qvac/sdk");
    return true;
  } catch {
    return false;
  }
}

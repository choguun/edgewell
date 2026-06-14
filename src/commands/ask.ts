// @ts-nocheck
import { c } from "../cli.js";

export async function askCommand(args, ew) {
  const q = args.join(" ").trim();
  if (!q) {
    console.error("usage: edgewell ask \"<question>\"");
    process.exit(2);
  }
  const { agent, reply } = await ew.orchestrator.ask(q);
  console.log(c.dim(`[${agent}]`));
  console.log(reply);
}

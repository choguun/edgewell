// `edgewell eval` runs a one-shot expression through the calculator
// tool. Handy for quick math without leaving the CLI.

import { ToolRegistry } from "../tools.js";

export async function evalCommand(args) {
  const expr = args.join(" ");
  if (!expr) {
    console.error("usage: edgewell eval <expression>");
    process.exit(2);
  }
  const tools = new ToolRegistry();
  try {
    const out = await tools.call("calculator", { expression: expr });
    console.log(out.result);
  } catch (err) {
    console.error("error:", err.message);
    process.exit(1);
  }
}

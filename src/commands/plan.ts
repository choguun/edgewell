// @ts-nocheck
import { parseFlags } from "../cli.js";

export async function planCommand(args, ew) {
  const [sub, ...rest] = args;
  if (sub === "health") {
    const goal = rest.join(" ").trim() || "feel more energetic";
    const out = await ew.health.plan(goal);
    console.log(out);
  } else if (sub === "finance") {
    const flags = parseFlags(rest, { income: 0 });
    const income = Number(flags.income) || 0;
    const out = await ew.finance.monthlyPlan({ income });
    console.log(out);
  } else {
    console.error("usage: edgewell plan <health|finance>");
    process.exit(2);
  }
}

// @ts-nocheck
import { listModels, describeModel } from "../registry.js";
import { c } from "../cli.js";

export async function modelsCommand(args) {
  const [sub, id] = args;
  if (sub === "describe" && id) {
    console.log(JSON.stringify({ id, ...describeModel(id) }, null, 2));
    return;
  }
  if (sub === "list") {
    const all = listModels();
    for (const m of all) {
      console.log(
        `${c.cyan(m.id.padEnd(36))} ${m.family.padEnd(8)} ${String(m.size).padEnd(5)} ${m.quant.padEnd(8)} ${c.dim(m.tier)}`,
      );
    }
    return;
  }
  console.error("usage: edgewell models <list|describe <id>>");
  process.exit(2);
}

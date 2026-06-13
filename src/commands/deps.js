// `edgewell deps` lists the runtime and dev dependencies declared
// in package.json. Useful for security audits and supply-chain
// reviews.

import { readFile } from "node:fs/promises";
import { c, header } from "../cli.js";

export async function depsCommand(_args, _ew) {
  header("EdgeWell dependencies");
  const raw = await readFile("./package.json", "utf8");
  const pkg = JSON.parse(raw);
  const runtime = pkg.dependencies ?? {};
  const dev = pkg.devDependencies ?? {};
  if (Object.keys(runtime).length > 0) {
    console.log(c.bold("runtime:"));
    for (const [k, v] of Object.entries(runtime)) {
      console.log(`  ${k.padEnd(24)} ${v}`);
    }
  }
  if (Object.keys(dev).length > 0) {
    console.log(c.bold("dev:"));
    for (const [k, v] of Object.entries(dev)) {
      console.log(`  ${k.padEnd(24)} ${v}`);
    }
  }
  if (Object.keys(runtime).length === 0 && Object.keys(dev).length === 0) {
    console.log(c.dim("(no dependencies declared)"));
  }
}

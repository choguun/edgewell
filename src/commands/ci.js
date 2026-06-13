// `edgewell ci` runs the same checks as the GitHub Actions workflow
// locally: unit tests, a CLI smoke test, and a vet pass. Useful for
// catching CI failures before pushing.

import { spawnSync } from "node:child_process";
import { c, header } from "../cli.js";

export async function ciCommand(_args, _ew) {
  header("EdgeWell CI");
  const steps = [
    { name: "unit tests", cmd: ["node", "--test", "test/*.test.js"], cwd: "." },
    { name: "CLI smoke", cmd: ["node", "bin/edgewell.js", "help"], cwd: "." },
    { name: "vet", cmd: ["node", "--check", "src/index.js"], cwd: "." },
  ];
  let ok = true;
  for (const step of steps) {
    process.stdout.write(`  ${c.cyan(step.name.padEnd(14))} ... `);
    const r = spawnSync(step.cmd[0], step.cmd.slice(1), { cwd: step.cwd, stdio: "pipe" });
    if (r.status === 0) {
      console.log(c.green("ok"));
    } else {
      ok = false;
      console.log(c.red("FAIL"));
      process.stdout.write(r.stdout?.toString() ?? "");
      process.stderr.write(r.stderr?.toString() ?? "");
    }
  }
  if (!ok) process.exit(1);
}

// @ts-nocheck
// `edgewell ci-summary` parses the most recent `node --test` run
// output and prints a one-line summary. v3.0.0 uses this in CI to
// surface pass/fail counts in the GitHub Actions summary.

import { promises as fs } from "node:fs";
import { c, header } from "../cli.js";

export async function ciSummaryCommand(args) {
  const logFile = args[0] ?? "./test-output.log";
  header(`CI summary: ${logFile}`);
  let text;
  try {
    text = await fs.readFile(logFile, "utf8");
  } catch {
    console.log(c.yellow(`(no log file at ${logFile})`));
    return;
  }
  const m = text.match(/tests\s+(\d+)\s+pass\s+(\d+)\s+fail\s+(\d+)/);
  if (!m) {
    console.log(c.yellow("(could not parse the test summary line)"));
    return;
  }
  const [, total, pass, fail] = m;
  const ok = Number(fail) === 0;
  console.log(`${c.bold("total:")} ${total}`);
  console.log(`${c.bold("pass:")}  ${pass}`);
  console.log(`${c.bold("fail:")}  ${fail}`);
  console.log(ok ? c.green("CI: OK") : c.red("CI: FAILED"));
}

// `edgewell test-summary <log>` parses a `node --test` log and
// prints a short summary. v3.0.0 keeps this thin: it looks for
// the `tests N pass N fail N` line.

import { promises as fs } from "node:fs";
import { c } from "../cli.js";

export async function testSummaryCommand(args) {
  const logFile = args[0] ?? "./test-output.log";
  let text;
  try {
    text = await fs.readFile(logFile, "utf8");
  } catch {
    console.log(c.yellow(`(no log at ${logFile})`));
    return;
  }
  const m = text.match(/tests\s+(\d+)\s+pass\s+(\d+)\s+fail\s+(\d+)/);
  if (!m) {
    console.log(c.yellow("(could not parse the test summary line)"));
    return;
  }
  console.log(`${c.bold("tests:")} ${m[1]}  ${c.green("pass:")} ${m[2]}  ${c.red("fail:")} ${m[3]}`);
}

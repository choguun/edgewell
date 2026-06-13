// `edgewell snapshot-validate <file.json>` reads a snapshot file
// and reports whether it is a valid EdgeWell snapshot. v3.0.0
// checks for the expected top-level fields and a numeric
// `version` if present.

import { promises as fs } from "node:fs";
import { c, header } from "../cli.js";

export async function snapshotValidateCommand(args) {
  const [inPath] = args;
  if (!inPath) {
    console.error("usage: edgewell snapshot-validate <file.json>");
    process.exit(2);
  }
  header(`Snapshot validate: ${inPath}`);
  let data;
  try {
    data = JSON.parse(await fs.readFile(inPath, "utf8"));
  } catch (err) {
    console.log(c.red(`invalid JSON: ${err.message}`));
    process.exit(1);
  }
  const issues = [];
  if (typeof data !== "object" || data === null) issues.push("root is not an object");
  if (typeof data === "object" && data !== null) {
    if (!("journal" in data)) issues.push("missing 'journal' field");
    if (!("expenses" in data)) issues.push("missing 'expenses' field");
    if (!Array.isArray(data.journal)) issues.push("'journal' is not an array");
    if (!Array.isArray(data.expenses)) issues.push("'expenses' is not an array");
  }
  if (data.version !== undefined && typeof data.version !== "string") {
    issues.push("'version' is not a string");
  }
  if (issues.length === 0) {
    console.log(c.green("snapshot is valid"));
    return;
  }
  console.log(c.yellow(`${issues.length} issue(s):`));
  for (const i of issues) console.log(`  - ${i}`);
  process.exit(1);
}

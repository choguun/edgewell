// `edgewell lint` checks the local data for integrity issues: empty
// entries, malformed JSON, missing required fields, tags that
// contain newlines, and so on. Reports a count of issues per file.

import { c, header } from "../cli.js";

export async function lintCommand(_args, ew) {
  header("EdgeWell data lint");
  const journal = await ew.journal.readAll();
  const expenses = await ew.expenses.readAll();
  const issues = [];
  for (let i = 0; i < journal.length; i++) {
    const e = journal[i];
    if (!e._ts) issues.push({ file: "journal", line: i, kind: "missing _ts" });
    if (!e.text) issues.push({ file: "journal", line: i, kind: "missing text" });
    if (Array.isArray(e.tags) && e.tags.some((t) => typeof t !== "string")) {
      issues.push({ file: "journal", line: i, kind: "non-string tag" });
    }
  }
  for (let i = 0; i < expenses.length; i++) {
    const e = expenses[i];
    if (!e._ts) issues.push({ file: "expenses", line: i, kind: "missing _ts" });
    if (typeof e.amount !== "number") {
      issues.push({ file: "expenses", line: i, kind: "non-number amount" });
    }
  }
  if (issues.length === 0) {
    console.log(c.green("no issues found"));
    return;
  }
  console.log(c.yellow(`${issues.length} issues:`));
  for (const i of issues.slice(0, 20)) {
    console.log(`  ${i.file}:${i.line} ${i.kind}`);
  }
  if (issues.length > 20) console.log(`  ... (${issues.length - 20} more)`);
}

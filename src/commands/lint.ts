// @ts-nocheck
// `edgewell lint` checks the local data for integrity issues: empty
// entries, malformed JSON, missing required fields, tags that
// contain newlines, and so on. Reports a count of issues per file.

import { c, header } from "../cli.js";

// Mirrors EXPENSE_SCHEMA bounds in src/schemas.js.
const EXPENSE_MIN = 0;
const EXPENSE_MAX = 1_000_000_000;

export async function lintCommand(_args, ew) {
  header("EdgeWell data lint");
  const journal = await ew.journal.readAll();
  const expenses = await ew.expenses.readAll();
  const issues = [];
  for (let i = 0; i < journal.length; i++) {
    const e = journal[i];
    if (!e._ts) issues.push({ file: "journal", line: i, kind: "missing _ts" });
    if (typeof e.text !== "string") {
      issues.push({ file: "journal", line: i, kind: "missing text" });
    } else if (e.text.length === 0) {
      issues.push({ file: "journal", line: i, kind: "empty text" });
    } else if (e.text.trim().length === 0) {
      issues.push({ file: "journal", line: i, kind: "whitespace-only text" });
    } else if (e.text.includes("\n")) {
      issues.push({ file: "journal", line: i, kind: "newline in text" });
    }
    if (Array.isArray(e.tags) && e.tags.some((t) => typeof t !== "string")) {
      issues.push({ file: "journal", line: i, kind: "non-string tag" });
    }
  }
  for (let i = 0; i < expenses.length; i++) {
    const e = expenses[i];
    if (!e._ts) issues.push({ file: "expenses", line: i, kind: "missing _ts" });
    if (typeof e.amount !== "number" || !Number.isFinite(e.amount)) {
      issues.push({ file: "expenses", line: i, kind: "non-finite amount" });
    } else if (e.amount < EXPENSE_MIN) {
      issues.push({ file: "expenses", line: i, kind: `negative amount (${e.amount})` });
    } else if (e.amount > EXPENSE_MAX) {
      issues.push({ file: "expenses", line: i, kind: `out-of-range amount (${e.amount})` });
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
  // We do not call process.exit() here: many existing tests
  // import the lint function as a library and don't want a
  // non-zero exit to fail the test runner. CI scripts that need
  // a non-zero status can grep the output for "issues:" instead.
}

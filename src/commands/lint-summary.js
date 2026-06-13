// `edgewell lint-summary` returns a small JSON object summarizing
// the data integrity state of the journal and expenses. v3.0.0
// prints the JSON so it can be piped into other tools (jq, curl,
// etc.).

import { c } from "../cli.js";

function summarise(entries, expectedFields) {
  const issues = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    for (const f of expectedFields) {
      if (e[f] === undefined) issues.push({ line: i, kind: `missing ${f}` });
    }
  }
  return { count: entries.length, issues: issues.length };
}

export async function lintSummaryCommand(_args, ew) {
  const journal = await ew.journal.readAll();
  const expenses = await ew.expenses.readAll();
  const summary = {
    journal: summarise(journal, ["_ts", "text"]),
    expenses: summarise(expenses, ["_ts", "amount"]),
  };
  console.log(JSON.stringify(summary, null, 2));
  const total = summary.journal.issues + summary.expenses.issues;
  if (total > 0) console.error(c.yellow(`${total} issue(s) — run \`edgewell lint\` for details`));
}

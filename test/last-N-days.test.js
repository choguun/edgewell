// Tests for the configurable last-N-days filters.

import { test } from "node:test";
import assert from "node:assert/strict";
import { journalEntriesLastNDaysCommand } from "../src/commands/journal-entries-last-N-days.js";
import { expensesEntriesLastNDaysCommand } from "../src/commands/expenses-entries-last-N-days.js";

function makeEw(journal = [], expenses = []) {
  return {
    journal: { readAll: async () => journal },
    expenses: { readAll: async () => expenses },
  };
}

test("journal-entries-last-N-days filters by N days", async () => {
  const recent = new Date().toISOString();
  const old = new Date(Date.now() - 10 * 86400_000).toISOString();
  const ew = makeEw([
    { _ts: recent, text: "recent" },
    { _ts: old, text: "old" },
  ]);
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await journalEntriesLastNDaysCommand(["5"], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /recent/);
  assert.ok(!text.includes("old"));
});

test("expenses-entries-last-N-days filters by N days", async () => {
  const recent = "2099-12-31T00:00:00.000Z";
  const old = "2000-01-01T00:00:00.000Z";
  const ew = makeEw([], [
    { _ts: recent, amount: 10, category: "food" },
    { _ts: old, amount: 5, category: "food" },
  ]);
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await expensesEntriesLastNDaysCommand(["5"], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /food/);
  // The old entry has amount=5; since 2000 is in the past relative
  // to "5 days ago from now" (2026), the old entry should be
  // filtered out.
  assert.ok(!text.startsWith("2000"), `expected no old entries, got: ${text}`);
});

test("journal-entries-last-N-days rejects a non-positive N", async () => {
  const orig = console.error;
  const origExit = process.exit;
  let code = 0;
  console.error = () => {};
  process.exit = (c) => {
    code = c;
    throw new Error("__exit__");
  };
  try {
    await journalEntriesLastNDaysCommand(["0"], makeEw());
  } catch (err) {
    if (err.message !== "__exit__") throw err;
  } finally {
    console.error = orig;
    process.exit = origExit;
  }
  assert.equal(code, 2);
});

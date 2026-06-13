// Tests for the day-of-month filters and the journal/expenses
// summary commands.

import { test } from "node:test";
import assert from "node:assert/strict";
import { journalEntriesDayOfMonthCommand } from "../src/commands/journal-entries-day-of-month.js";
import { expensesEntriesDayOfMonthCommand } from "../src/commands/expenses-entries-day-of-month.js";
import { journalSummaryDetailedCommand } from "../src/commands/journal-summary-detailed.js";
import { expensesSummaryDetailedCommand } from "../src/commands/expenses-summary-detailed.js";

function makeEw(journal = [], expenses = []) {
  return {
    journal: { readAll: async () => journal },
    expenses: { readAll: async () => expenses },
  };
}

test("journal-entries-day-of-month filters by day of month", async () => {
  const ew = makeEw([
    { _ts: "2026-01-15T08:00:00Z", text: "a" },
    { _ts: "2026-02-15T08:00:00Z", text: "b" },
    { _ts: "2026-01-16T08:00:00Z", text: "c" },
  ]);
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await journalEntriesDayOfMonthCommand(["15"], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /a/);
  assert.match(text, /b/);
  assert.ok(!text.includes("c"));
});

test("journal-entries-day-of-month rejects an out-of-range day", async () => {
  const orig = console.error;
  const origExit = process.exit;
  let code = 0;
  console.error = () => {};
  process.exit = (c) => {
    code = c;
    throw new Error("__exit__");
  };
  try {
    await journalEntriesDayOfMonthCommand(["32"], makeEw());
  } catch (err) {
    if (err.message !== "__exit__") throw err;
  } finally {
    console.error = orig;
    process.exit = origExit;
  }
  assert.equal(code, 2);
});

test("expenses-entries-day-of-month filters by day of month", async () => {
  const ew = makeEw([], [
    { _ts: "2026-01-15T08:00:00Z", amount: 10, category: "food" },
    { _ts: "2026-01-16T08:00:00Z", amount: 5, category: "transport" },
  ]);
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await expensesEntriesDayOfMonthCommand(["15"], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /food/);
  assert.ok(!text.includes("transport"));
});

test("journal-summary-detailed prints a multi-line report", async () => {
  const ew = makeEw([
    { _ts: "2026-01-15T08:00:00Z", text: "a", tags: ["x"] },
    { _ts: "2026-01-16T08:00:00Z", text: "bb", tags: ["y"] },
  ]);
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await journalSummaryDetailedCommand([], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /entries:\s+2/);
  assert.match(text, /distinct tags:\s+2/);
});

test("expenses-summary-detailed prints a multi-line report", async () => {
  const ew = makeEw([], [
    { _ts: "2026-01-15T08:00:00Z", amount: 10, category: "food" },
    { _ts: "2026-01-16T08:00:00Z", amount: 5, category: "transport" },
  ]);
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await expensesSummaryDetailedCommand([], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /count:\s+2/);
  assert.match(text, /total:\s+15\.00/);
  assert.match(text, /distinct categor/);
});

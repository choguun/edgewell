// Tests for the journal-stats and expenses-stats CLI commands.

import { test } from "node:test";
import assert from "node:assert/strict";
import { journalStatsCommand } from "../src/commands/journal-stats.js";
import { expensesStatsCommand } from "../src/commands/expenses-stats.js";

test("journal-stats reports no data for an empty journal", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await journalStatsCommand([], { journal: { readAll: async () => [] } });
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /no journal entries/);
});

test("journal-stats reports count and avg length", async () => {
  const ew = {
    journal: {
      readAll: async () => [
        { _ts: "2026-01-15T08:00:00Z", text: "short" },
        { _ts: "2026-01-16T08:00:00Z", text: "a longer entry today" },
      ],
    },
  };
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await journalStatsCommand([], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /count:\s+2/);
  assert.match(text, /avg len:/);
});

test("expenses-stats reports no data for an empty store", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await expensesStatsCommand([], { expenses: { readAll: async () => [] } });
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /no expenses/);
});

test("expenses-stats reports total and per-category", async () => {
  const ew = {
    expenses: {
      readAll: async () => [
        { _ts: "t1", amount: 5, category: "food" },
        { _ts: "t2", amount: 10, category: "food" },
        { _ts: "t3", amount: 3, category: "transport" },
      ],
    },
  };
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await expensesStatsCommand([], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /total:\s+18\.00/);
  assert.match(text, /food\s+15\.00/);
  assert.match(text, /transport\s+3\.00/);
});

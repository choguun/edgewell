// Tests for the budget and savings-rate CLI commands.

import { test } from "node:test";
import assert from "node:assert/strict";
import { budgetCommand } from "../src/commands/budget.js";
import { savingsRateCommand } from "../src/commands/savings-rate.js";

test("budget prints a breakdown for a positive income", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await budgetCommand(["5000"]);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /savings:\s+1000\.00\s+\(20%\)/);
  assert.match(text, /fixed costs:\s+2500\.00\s+\(50%\)/);
  assert.match(text, /discretionary:\s+1500\.00/);
});

test("budget rejects a non-positive income", async () => {
  const orig = console.error;
  const origExit = process.exit;
  let code = 0;
  console.error = () => {};
  process.exit = (c) => {
    code = c;
    throw new Error("__exit__");
  };
  try {
    await budgetCommand(["0"]);
  } catch (err) {
    if (err.message !== "__exit__") throw err;
  } finally {
    console.error = orig;
    process.exit = origExit;
  }
  assert.equal(code, 2);
});

test("savings-rate prints the rate for a profile with monthly income", async () => {
  const ew = {
    profile: { load: async () => ({ monthlyIncome: 5000 }) },
    expenses: {
      readAll: async () => [
        { _ts: new Date().toISOString().slice(0, 8) + "01T00:00:00Z", amount: 1000, category: "food" },
        { _ts: new Date().toISOString().slice(0, 8) + "02T00:00:00Z", amount: 500, category: "transport" },
      ],
    },
  };
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await savingsRateCommand([], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /income:\s+5000/);
  assert.match(text, /spent:\s+1500/);
  assert.match(text, /rate:\s+70\.0%/);
});

test("savings-rate warns when no monthly income is set", async () => {
  const ew = {
    profile: { load: async () => ({}) },
    expenses: { readAll: async () => [] },
  };
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await savingsRateCommand([], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /monthlyIncome/);
});

// @ts-nocheck
// Tests for the lint and lint-summary CLI commands.

import { test } from "node:test";
import assert from "node:assert/strict";
import { lintCommand } from "../src/commands/lint.js";
import { lintSummaryCommand } from "../src/commands/lint-summary.js";

function makeEw(journal = [], expenses = []) {
  return {
    journal: { readAll: async () => journal },
    expenses: { readAll: async () => expenses },
  };
}

test("lint reports no issues for a clean journal", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await lintCommand([], makeEw([{ _ts: "t", text: "hello" }], [{ _ts: "t", amount: 1 }]));
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /no issues found/);
});

test("lint reports missing _ts fields", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await lintCommand([], makeEw([{ text: "no _ts" }], []));
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /1 issues/);
  assert.match(text, /missing _ts/);
});

test("lint-summary emits a JSON object", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await lintSummaryCommand([], makeEw([{ _ts: "t", text: "ok" }], [{ _ts: "t", amount: 1 }]));
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  const json = JSON.parse(text);
  assert.equal(json.journal.count, 1);
  assert.equal(json.journal.issues, 0);
  assert.equal(json.expenses.count, 1);
  assert.equal(json.expenses.issues, 0);
});

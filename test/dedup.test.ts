// @ts-nocheck
// Tests for the dedup CLI command.

import { test } from "node:test";
import assert from "node:assert/strict";
import { dedupCommand } from "../src/commands/dedup.js";

function makeEw(journal = [], expenses = []) {
  return {
    journal: { readAll: async () => journal },
    expenses: { readAll: async () => expenses },
  };
}

test("dedup reports no duplicates for an empty store", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await dedupCommand([], makeEw());
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /0 duplicate/);
  assert.match(text, /no duplicates found/);
});

test("dedup finds a duplicate journal entry", async () => {
  const entry = { _ts: "2026-01-15T08:00:00Z", text: "hello world" };
  const ew = makeEw([entry, entry], []);
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await dedupCommand([], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /1 duplicate/);
});

test("dedup finds a duplicate expense entry", async () => {
  const ex = { _ts: "2026-01-15T08:00:00Z", amount: 5, category: "food" };
  const ew = makeEw([], [ex, ex]);
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await dedupCommand([], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /1 duplicate/);
});

test("dedup does not flag distinct entries", async () => {
  const ew = makeEw(
    [
      { _ts: "2026-01-15T08:00:00Z", text: "alpha" },
      { _ts: "2026-01-15T09:00:00Z", text: "beta" },
    ],
    [
      { _ts: "2026-01-15T08:00:00Z", amount: 5, category: "food" },
      { _ts: "2026-01-15T09:00:00Z", amount: 6, category: "food" },
    ],
  );
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await dedupCommand([], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /no duplicates found/);
});

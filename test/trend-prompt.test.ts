// @ts-nocheck
// Tests for the trend and prompt CLI commands.

import { test } from "node:test";
import assert from "node:assert/strict";
import { trendCommand } from "../src/commands/trend.js";
import { promptCommand } from "../src/commands/prompt.js";

test("trend extracts a mood series from the journal", async () => {
  const ew = {
    journal: {
      readAll: async () => [
        { _ts: "2026-01-15T08:00:00Z", text: "mood: 7" },
        { _ts: "2026-01-16T08:00:00Z", text: "mood: 8" },
        { _ts: "2026-01-17T08:00:00Z", text: "mood: 5" },
      ],
    },
  };
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await trendCommand(["mood"], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /2026-01-15\s+7/);
  assert.match(text, /2026-01-17\s+5/);
});

test("trend rejects an unsupported metric with exit 2", async () => {
  const orig = console.error;
  const origExit = process.exit;
  let code = 0;
  console.error = () => {};
  process.exit = (c) => {
    code = c;
    throw new Error("__exit__");
  };
  try {
    await trendCommand(["bogus"], { journal: { readAll: async () => [] } });
  } catch (err) {
    if (err.message !== "__exit__") throw err;
  } finally {
    console.error = orig;
    process.exit = origExit;
  }
  assert.equal(code, 2);
});

test("prompt renders the health template", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await promptCommand(["health", "how should I sleep"]);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /EdgeWell Health/);
  assert.match(text, /how should I sleep/);
});

test("prompt exits with code 2 for no args", async () => {
  const orig = console.error;
  const origExit = process.exit;
  let code = 0;
  console.error = () => {};
  process.exit = (c) => {
    code = c;
    throw new Error("__exit__");
  };
  try {
    await promptCommand([]);
  } catch (err) {
    if (err.message !== "__exit__") throw err;
  } finally {
    console.error = orig;
    process.exit = origExit;
  }
  assert.equal(code, 2);
});

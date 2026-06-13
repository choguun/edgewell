// Tests for the snippet CLI command.

import { test } from "node:test";
import assert from "node:assert/strict";
import { snippetCommand } from "../src/commands/snippet.js";

test("snippet renders a known template", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await snippetCommand(["health", "how", "should", "I", "sleep"]);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /EdgeWell Health/);
  assert.match(text, /how should I sleep/);
});

test("snippet with no args uses a default question", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await snippetCommand(["health"]);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /focus on this week/);
});

test("snippet exits with code 2 when no name is given", async () => {
  const orig = console.error;
  const origExit = process.exit;
  let code = 0;
  console.error = () => {};
  process.exit = (c) => {
    code = c;
    throw new Error("__exit__");
  };
  try {
    await snippetCommand([]);
  } catch (err) {
    if (err.message !== "__exit__") throw err;
  } finally {
    console.error = orig;
    process.exit = origExit;
  }
  assert.equal(code, 2);
});

test("snippet exits with code 1 for an unknown template", async () => {
  const orig = console.error;
  const origExit = process.exit;
  let code = 0;
  console.error = () => {};
  process.exit = (c) => {
    code = c;
    throw new Error("__exit__");
  };
  try {
    await snippetCommand(["bogus"]);
  } catch (err) {
    if (err.message !== "__exit__") throw err;
  } finally {
    console.error = orig;
    process.exit = origExit;
  }
  assert.equal(code, 1);
});

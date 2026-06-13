// Tests for the tag-suggest CLI command.

import { test } from "node:test";
import assert from "node:assert/strict";
import { tagSuggestCommand } from "../src/commands/tag-suggest.js";

test("tag-suggest suggests 'sleep' for sleep-related text", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await tagSuggestCommand(["I", "slept", "8", "hours"]);
  } finally {
    console.log = orig;
  }
  assert.match(logs.join(" "), /sleep/);
});

test("tag-suggest suggests 'meal' for food-related text", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await tagSuggestCommand(["had", "breakfast", "and", "lunch"]);
  } finally {
    console.log = orig;
  }
  assert.match(logs.join(" "), /meal/);
});

test("tag-suggest suggests 'activity' for exercise text", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await tagSuggestCommand(["went", "for", "a", "walk"]);
  } finally {
    console.log = orig;
  }
  assert.match(logs.join(" "), /activity/);
});

test("tag-suggest returns no suggestions for unrelated text", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await tagSuggestCommand(["the", "quick", "brown", "fox"]);
  } finally {
    console.log = orig;
  }
  assert.match(logs.join(" "), /no suggestions/);
});

test("tag-suggest rejects empty input", async () => {
  const orig = console.error;
  const origExit = process.exit;
  let code = 0;
  console.error = () => {};
  process.exit = (c) => {
    code = c;
    throw new Error("__exit__");
  };
  try {
    await tagSuggestCommand([]);
  } catch (err) {
    if (err.message !== "__exit__") throw err;
  } finally {
    console.error = orig;
    process.exit = origExit;
  }
  assert.equal(code, 2);
});

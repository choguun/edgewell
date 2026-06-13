// Tests for the rot13 CLI command.

import { test } from "node:test";
import assert from "node:assert/strict";
import { rot13Command } from "../src/commands/rot13.js";

test("rot13 encodes a basic string", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await rot13Command(["hello"]);
  } finally {
    console.log = orig;
  }
  assert.equal(logs.join(""), "uryyb");
});

test("rot13 is self-inverse", async () => {
  const original = "EdgeWell";
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await rot13Command([original]);
    const once = logs.join("");
    logs.length = 0;
    await rot13Command([once]);
  } finally {
    console.log = orig;
  }
  assert.equal(logs.join(""), original);
});

test("rot13 rejects empty input", async () => {
  const orig = console.error;
  const origExit = process.exit;
  let code = 0;
  console.error = () => {};
  process.exit = (c) => {
    code = c;
    throw new Error("__exit__");
  };
  try {
    await rot13Command([]);
  } catch (err) {
    if (err.message !== "__exit__") throw err;
  } finally {
    console.error = orig;
    process.exit = origExit;
  }
  assert.equal(code, 2);
});

test("rot13 leaves non-letters unchanged", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await rot13Command(["abc 123 !@#"]);
  } finally {
    console.log = orig;
  }
  assert.equal(logs.join(""), "nop 123 !@#");
});

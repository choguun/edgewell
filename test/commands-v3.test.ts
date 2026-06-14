// @ts-nocheck
// Tests for v3.0.0 CLI commands (profiles, companion stub).

import { test } from "node:test";
import assert from "node:assert/strict";
import { profilesCommand } from "../src/commands/profiles.js";

test("profiles list prints the three form-factor names", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await profilesCommand(["list"]);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /mobile/);
  assert.match(text, /tinkerer/);
  assert.match(text, /desktop/);
});

test("profiles show <name> prints the resolved config", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await profilesCommand(["show", "mobile"]);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /mobile/);
  assert.match(text, /localModel/);
});

test("profiles show without name exits with code 2", async () => {
  const origErr = console.error;
  const origExit = process.exit;
  let code = 0;
  console.error = () => {};
  process.exit = (c) => {
    code = c;
    throw new Error("__exit__");
  };
  try {
    await profilesCommand(["show"]);
  } catch (err) {
    if (err.message !== "__exit__") throw err;
  } finally {
    console.error = origErr;
    process.exit = origExit;
  }
  assert.equal(code, 2);
});

test("profiles apply prints confirmation", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await profilesCommand(["apply", "tinkerer"]);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /tinkerer/);
});

test("profiles unknown subcommand exits with code 2", async () => {
  const origErr = console.error;
  const origExit = process.exit;
  let code = 0;
  console.error = () => {};
  process.exit = (c) => {
    code = c;
    throw new Error("__exit__");
  };
  try {
    await profilesCommand(["bogus"]);
  } catch (err) {
    if (err.message !== "__exit__") throw err;
  } finally {
    console.error = origErr;
    process.exit = origExit;
  }
  assert.equal(code, 2);
});

test("profiles unknown profile name throws", async () => {
  const origErr = console.error;
  console.error = () => {};
  try {
    await profilesCommand(["show", "spaceship"]);
    assert.fail("should have thrown");
  } catch (err) {
    assert.match(err.message, /unknown profile/);
  } finally {
    console.error = origErr;
  }
});

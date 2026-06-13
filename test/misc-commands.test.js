// Tests for misc v3.0.0 CLI commands: head, entry-show, tag-most-recent.

import { test } from "node:test";
import assert from "node:assert/strict";
import { headCommand } from "../src/commands/head.js";
import { entryShowCommand } from "../src/commands/entry-show.js";
import { tagMostRecentCommand } from "../src/commands/tag-most-recent.js";

function makeEw(journal = []) {
  return { journal: { readAll: async () => journal } };
}

test("head prints the first N journal entries", async () => {
  const ew = makeEw([
    { _ts: "t1", text: "a" },
    { _ts: "t2", text: "b" },
    { _ts: "t3", text: "c" },
  ]);
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await headCommand(["2"], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /a/);
  assert.match(text, /b/);
  assert.ok(!text.includes("c"), "should not show entry 3");
});

test("head rejects a non-positive count", async () => {
  const orig = console.error;
  const origExit = process.exit;
  let code = 0;
  console.error = () => {};
  process.exit = (c) => {
    code = c;
    throw new Error("__exit__");
  };
  try {
    await headCommand(["0"], makeEw());
  } catch (err) {
    if (err.message !== "__exit__") throw err;
  } finally {
    console.error = orig;
    process.exit = origExit;
  }
  assert.equal(code, 2);
});

test("entry-show prints a single entry by id", async () => {
  const ew = makeEw([
    { _ts: "t1", text: "first" },
    { _ts: "t2", text: "second", tags: ["x"] },
  ]);
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await entryShowCommand(["1"], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /second/);
  assert.match(text, /x/);
});

test("entry-show rejects an out-of-range id", async () => {
  const orig = console.error;
  const origExit = process.exit;
  let code = 0;
  console.error = () => {};
  process.exit = (c) => {
    code = c;
    throw new Error("__exit__");
  };
  try {
    await entryShowCommand(["99"], makeEw([{ _ts: "t", text: "a" }]));
  } catch (err) {
    if (err.message !== "__exit__") throw err;
  } finally {
    console.error = orig;
    process.exit = origExit;
  }
  assert.equal(code, 2);
});

test("tag-most-recent prints the tags of the most recent entry", async () => {
  const ew = makeEw([
    { _ts: "t1", text: "first" },
    { _ts: "t2", text: "last", tags: ["x", "y"] },
  ]);
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await tagMostRecentCommand([], ew);
  } finally {
    console.log = orig;
  }
  assert.equal(logs.join(""), "x y");
});

test("tag-most-recent reports no tags when the last entry has none", async () => {
  const ew = makeEw([{ _ts: "t", text: "x" }]);
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await tagMostRecentCommand([], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join(" ");
  assert.match(text, /no tags/);
});

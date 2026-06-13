// Tests for the tag-percent and tag-orphans CLI commands.

import { test } from "node:test";
import assert from "node:assert/strict";
import { tagPercentCommand } from "../src/commands/tag-percent.js";
import { tagOrphansCommand } from "../src/commands/tag-orphans.js";

function makeEw(journal = []) {
  return { journal: { readAll: async () => journal } };
}

test("tag-percent prints percentages summing to ~100%", async () => {
  const ew = makeEw([
    { _ts: "t", text: "a", tags: ["x"] },
    { _ts: "t", text: "b", tags: ["x"] },
    { _ts: "t", text: "c", tags: ["x"] },
    { _ts: "t", text: "d", tags: ["y"] },
  ]);
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await tagPercentCommand([], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /x\s+75\.0%/);
  assert.match(text, /y\s+25\.0%/);
});

test("tag-percent reports no data for an empty journal", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await tagPercentCommand([], makeEw());
  } finally {
    console.log = orig;
  }
  assert.match(logs.join(" "), /no tagged/);
});

test("tag-orphans reports no orphans when each tag has 2+ entries", async () => {
  const ew = makeEw([
    { _ts: "t", text: "a", tags: ["x"] },
    { _ts: "t", text: "b", tags: ["x"] },
  ]);
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await tagOrphansCommand([], ew);
  } finally {
    console.log = orig;
  }
  assert.match(logs.join(" "), /no orphan/);
});

test("tag-orphans lists tags used only once", async () => {
  const ew = makeEw([
    { _ts: "t", text: "a", tags: ["x", "y"] },
    { _ts: "t", text: "b", tags: ["x"] },
  ]);
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await tagOrphansCommand([], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /y/);
  assert.ok(!/^\s+x\s*$/m.test(text), "x should not be in orphans");
});

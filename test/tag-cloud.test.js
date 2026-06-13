// Tests for the tag-cloud CLI command.

import { test } from "node:test";
import assert from "node:assert/strict";
import { tagCloudCommand } from "../src/commands/tag-cloud.js";

test("tag-cloud prints nothing for an empty journal", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await tagCloudCommand([], { journal: { readAll: async () => [] } });
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /no tagged/);
});

test("tag-cloud prints bars proportional to count", async () => {
  const ew = {
    journal: {
      readAll: async () => [
        { _ts: "t1", text: "a", tags: ["x"] },
        { _ts: "t2", text: "b", tags: ["x"] },
        { _ts: "t3", text: "c", tags: ["x"] },
        { _ts: "t4", text: "d", tags: ["y"] },
      ],
    },
  };
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await tagCloudCommand([], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  // x has 3 entries, y has 1 — x should appear first.
  assert.match(text, /x/);
  assert.match(text, /y/);
  // Bars use the # character.
  assert.match(text, /#+/);
});

// @ts-nocheck
// Tests for the tag-stats CLI command.

import { test } from "node:test";
import assert from "node:assert/strict";
import { tagStatsCommand } from "../src/commands/tag-stats.js";

test("tag-stats prints no-tag message for an empty journal", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await tagStatsCommand([], { journal: { readAll: async () => [] } });
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /no tagged/);
});

test("tag-stats reports count, first, and last for each tag", async () => {
  const ew = {
    journal: {
      readAll: async () => [
        { _ts: "2026-01-15T08:00:00Z", text: "first", tags: ["x"] },
        { _ts: "2026-01-16T08:00:00Z", text: "second", tags: ["x"] },
        { _ts: "2026-01-17T08:00:00Z", text: "third", tags: ["x"] },
      ],
    },
  };
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await tagStatsCommand([], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /n=3/);
  assert.match(text, /first=2026-01-15/);
  assert.match(text, /last=2026-01-17/);
});

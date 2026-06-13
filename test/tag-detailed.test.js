// Tests for tag-stats-detailed and tag-stats-detailed-monthly CLI commands.

import { test } from "node:test";
import assert from "node:assert/strict";
import { tagStatsDetailedCommand } from "../src/commands/tag-stats-detailed.js";
import { tagStatsDetailedMonthlyCommand } from "../src/commands/tag-stats-detailed-monthly.js";

function makeEw(journal = []) {
  return { journal: { readAll: async () => journal } };
}

test("tag-stats-detailed reports longest and shortest per tag", async () => {
  const ew = makeEw([
    { _ts: "2026-01-15T08:00:00Z", text: "a", tags: ["x"] },
    { _ts: "2026-01-16T08:00:00Z", text: "bb", tags: ["x"] },
    { _ts: "2026-01-17T08:00:00Z", text: "ccc", tags: ["x"] },
  ]);
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await tagStatsDetailedCommand([], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /longest=3c/);
  assert.match(text, /shortest=1c/);
});

test("tag-stats-detailed-monthly reports top 3 per month", async () => {
  const ew = makeEw([
    { _ts: "2026-01-15T08:00:00Z", text: "a", tags: ["x", "y", "z"] },
    { _ts: "2026-01-16T08:00:00Z", text: "b", tags: ["x", "y"] },
    { _ts: "2026-01-17T08:00:00Z", text: "c", tags: ["x"] },
  ]);
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await tagStatsDetailedMonthlyCommand([], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /x/);
  assert.match(text, /y/);
  assert.match(text, /z/);
});

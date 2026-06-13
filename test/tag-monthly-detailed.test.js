// Tests for tag-stats-monthly-detailed and tag-stats-monthly-trend.

import { test } from "node:test";
import assert from "node:assert/strict";
import { tagStatsMonthlyDetailedCommand } from "../src/commands/tag-stats-monthly-detailed.js";
import { tagStatsMonthlyTrendCommand } from "../src/commands/tag-stats-monthly-trend.js";

function makeEw(journal = []) {
  return { journal: { readAll: async () => journal } };
}

test("tag-stats-monthly-detailed reports top 3 per month", async () => {
  const ew = makeEw([
    { _ts: "2026-01-15T08:00:00Z", text: "a", tags: ["x", "y", "z"] },
    { _ts: "2026-01-16T08:00:00Z", text: "b", tags: ["x", "y"] },
    { _ts: "2026-01-17T08:00:00Z", text: "c", tags: ["x"] },
  ]);
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await tagStatsMonthlyDetailedCommand([], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /2026-01\s+x/);
  assert.match(text, /y/);
  assert.match(text, /z/);
});

test("tag-stats-monthly-trend prints an ASCII bar chart", async () => {
  const ew = makeEw([
    { _ts: "2026-01-15T08:00:00Z", text: "a", tags: ["x", "y"] },
    { _ts: "2026-02-15T08:00:00Z", text: "b", tags: ["x"] },
  ]);
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await tagStatsMonthlyTrendCommand([], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /2026-01/);
  assert.match(text, /2026-02/);
  assert.match(text, /#+/);
});

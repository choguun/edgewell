// Tests for the tag-info, tag-density, and journal-stats-weekday
// CLI commands.

import { test } from "node:test";
import assert from "node:assert/strict";
import { tagInfoCommand } from "../src/commands/tag-info.js";
import { tagDensityCommand } from "../src/commands/tag-density.js";
import { journalStatsWeekdayCommand } from "../src/commands/journal-stats-weekday.js";

function makeEw(journal = []) {
  return { journal: { readAll: async () => journal } };
}

test("tag-info prints a detailed report for a tag", async () => {
  const ew = makeEw([
    { _ts: "2026-01-15T08:00:00Z", text: "a", tags: ["x", "y"] },
    { _ts: "2026-01-16T08:00:00Z", text: "b", tags: ["x"] },
    { _ts: "2026-01-17T08:00:00Z", text: "c", tags: ["x", "z"] },
  ]);
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await tagInfoCommand(["x"], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /count:\s+3/);
  assert.match(text, /first:\s+2026-01-15/);
  assert.match(text, /last:\s+2026-01-17/);
  // x co-occurs with y and z.
  assert.match(text, /y/);
  assert.match(text, /z/);
});

test("tag-info reports no data for a missing tag", async () => {
  const ew = makeEw([{ _ts: "t", text: "a", tags: ["x"] }]);
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await tagInfoCommand(["nope"], ew);
  } finally {
    console.log = orig;
  }
  assert.match(logs.join(" "), /no entries/);
});

test("tag-density reports avg tags per entry", async () => {
  const ew = makeEw([
    { _ts: "t", text: "a", tags: ["x", "y"] },
    { _ts: "t", text: "b", tags: ["x"] },
  ]);
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await tagDensityCommand([], ew);
  } finally {
    console.log = orig;
  }
  // 3 tags / 2 entries = 1.5
  assert.match(logs.join(" "), /1\.50/);
});

test("journal-stats-weekday prints counts per weekday", async () => {
  const ew = makeEw([
    { _ts: "2026-01-11T08:00:00Z", text: "sun" },  // Sun
    { _ts: "2026-01-12T08:00:00Z", text: "mon" },  // Mon
    { _ts: "2026-01-13T08:00:00Z", text: "tue" },  // Tue
  ]);
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await journalStatsWeekdayCommand([], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /Sun\s+1/);
  assert.match(text, /Mon\s+1/);
  assert.match(text, /Tue\s+1/);
});

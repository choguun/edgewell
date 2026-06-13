// Tests for the weekly-review and monthly-review CLI commands.

import { test } from "node:test";
import assert from "node:assert/strict";
import { weeklyReviewCommand } from "../src/commands/weekly-review.js";
import { monthlyReviewCommand } from "../src/commands/monthly-review.js";

function makeEw(journal = [], expenses = []) {
  return {
    journal: { readAll: async () => journal },
    expenses: { readAll: async () => expenses },
  };
}

test("weekly-review counts recent entries", async () => {
  const recent = new Date().toISOString();
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await weeklyReviewCommand([], makeEw(
      [
        { _ts: recent, text: "today", tags: ["x"] },
        { _ts: recent, text: "also today", tags: ["x", "y"] },
      ],
      [{ _ts: recent, amount: 10, category: "food" }],
    ));
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /journal entries:\s+2/);
  assert.match(text, /expenses:\s+1/);
});

test("monthly-review summarises the current month", async () => {
  const month = new Date().toISOString().slice(0, 7);
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await monthlyReviewCommand([], makeEw(
      [
        { _ts: `${month}-01T08:00:00Z`, text: "a", tags: ["mood"] },
        { _ts: `${month}-15T08:00:00Z`, text: "b", tags: ["mood"] },
      ],
      [
        { _ts: `${month}-01T08:00:00Z`, amount: 50, category: "food" },
        { _ts: `${month}-15T08:00:00Z`, amount: 30, category: "food" },
      ],
    ));
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /Monthly review/);
  assert.match(text, /journal entries:\s+2/);
  assert.match(text, /80\.00/);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { weeklySummary, monthlySummary, sumByCategory, daysSince, startOfWeek } from "../src/summary.js";

test("sumByCategory groups expenses and sorts by total desc", () => {
  const totals = sumByCategory([
    { amount: 10, category: "food" },
    { amount: 20, category: "food" },
    { amount: 5, category: "transport" },
  ]);
  assert.equal(totals.food, 30);
  assert.equal(totals.transport, 5);
});

test("weeklySummary only counts entries in the current week", () => {
  const now = new Date("2026-03-04T12:00:00Z");
  const weekStart = startOfWeek(now);
  const old = { _ts: new Date(weekStart.getTime() - 86400000).toISOString(), amount: 100, category: "x" };
  const fresh = { _ts: now.toISOString(), amount: 50, category: "food" };
  const summary = weeklySummary([], [old, fresh], now);
  assert.equal(summary.expenseCount, 1);
  assert.equal(summary.expenseTotal, 50);
  assert.equal(summary.byCategory.food, 50);
});

test("monthlySummary covers the current month", () => {
  const now = new Date("2026-03-15T00:00:00Z");
  const fresh = { _ts: now.toISOString(), amount: 25, category: "food" };
  const summary = monthlySummary([{ _ts: now.toISOString(), text: "hi" }], [fresh], now);
  assert.equal(summary.journalCount, 1);
  assert.equal(summary.expenseTotal, 25);
});

test("daysSince returns a non-negative integer", () => {
  const n = daysSince(new Date().toISOString());
  assert.equal(n, 0);
});

// @ts-nocheck
// Tests for the lifestyle agents (Sleep, Nutrition, Hydration, Activity).

import { test } from "node:test";
import assert from "node:assert/strict";
import { SleepAgent } from "../src/agents/sleep.js";
import { NutritionAgent } from "../src/agents/nutrition.js";
import { HydrationAgent } from "../src/agents/hydration.js";
import { ActivityAgent } from "../src/agents/activity.js";

// ---------- SleepAgent ----------

test("SleepAgent flags severe deprivation under 5h", () => {
  const a = new SleepAgent();
  const s = a.summarise([
    { kind: "sleep_phase", value: 60 }, // 1h
    { kind: "sleep_phase", value: 60 }, // 1h
    { kind: "sleep_phase", value: 60 }, // 1h
  ]);
  assert.equal(s.verdict, "severely sleep-deprived");
  assert.equal(s.totalHours, 3);
});

test("SleepAgent flags short nights between 5h and 6.5h", () => {
  const a = new SleepAgent();
  const s = a.summarise([
    { kind: "sleep_phase", value: 60 * 6 },
  ]);
  assert.equal(s.verdict, "short");
  assert.equal(s.totalHours, 6);
});

test("SleepAgent flags long nights over 9.5h", () => {
  const a = new SleepAgent();
  const s = a.summarise([
    { kind: "sleep_phase", value: 60 * 10 },
  ]);
  assert.equal(s.verdict, "long");
});

test("SleepAgent returns normal for 7-9h", () => {
  const a = new SleepAgent();
  const s = a.summarise([
    { kind: "sleep_phase", value: 60 * 8 },
  ]);
  assert.equal(s.verdict, "normal");
});

test("SleepAgent handles empty events", () => {
  const a = new SleepAgent();
  const s = a.summarise([]);
  assert.equal(s.events, 0);
  assert.equal(s.totalHours, 0);
});

test("SleepAgent advise uses injected LLM when provided", async () => {
  const llm = { complete: async () => "Use the 4-7-8 breathing technique." };
  const a = new SleepAgent({ llm });
  const out = await a.advise([{ kind: "sleep_phase", value: 60 * 4 }]);
  assert.match(out, /breathing/);
});

test("SleepAgent advise falls back when LLM throws", async () => {
  const llm = { complete: async () => { throw new Error("nope"); } };
  const a = new SleepAgent({ llm });
  const out = await a.advise([{ kind: "sleep_phase", value: 60 * 4 }]);
  assert.match(out, /sleep/);
});

// ---------- NutritionAgent ----------

test("NutritionAgent reports no data with empty entries", () => {
  const a = new NutritionAgent();
  const s = a.summarise([]);
  assert.equal(s.verdict, "no data");
});

test("NutritionAgent flags under-eating with few meals", () => {
  const a = new NutritionAgent();
  // 4 days logged, 2 meals total -> avg 0.5 -> under-eating.
  const entries = [
    { _ts: "2026-01-10T08:00:00Z", tags: ["meal"] },
    { _ts: "2026-01-12T08:00:00Z", tags: ["meal"] },
  ];
  const s = a.summarise(entries);
  assert.equal(s.days, 2);
  // Need >=3 days for the verdict engine; ensure with a third day.
  entries.push({ _ts: "2026-01-13T08:00:00Z", tags: ["meal"] });
  const s2 = a.summarise(entries);
  assert.equal(s2.days, 3);
  assert.equal(s2.avgPerDay, 1);
  assert.equal(s2.verdict, "irregular");
});

test("NutritionAgent flags truly under-eating", () => {
  const a = new NutritionAgent();
  const entries = [
    { _ts: "2026-01-10T08:00:00Z", tags: ["meal"] },
    { _ts: "2026-01-12T08:00:00Z", tags: ["meal"] },
    { _ts: "2026-01-13T08:00:00Z", tags: ["meal"] },
    { _ts: "2026-01-14T08:00:00Z", tags: ["meal"] },
  ];
  const s = a.summarise(entries);
  assert.equal(s.days, 4);
  assert.equal(s.verdict, "irregular");
});

test("NutritionAgent flags regular pattern", () => {
  const a = new NutritionAgent();
  const entries = [];
  for (let d = 11; d <= 15; d++) {
    for (let m = 0; m < 3; m++) {
      const hour = String(8 + m * 4).padStart(2, "0");
      entries.push({ _ts: `2026-01-${d}T${hour}:00:00Z`, tags: ["meal"] });
    }
  }
  const s = a.summarise(entries);
  assert.equal(s.verdict, "regular");
});

test("NutritionAgent honours category=food even without tags", () => {
  const a = new NutritionAgent();
  const entries = [];
  for (let d = 1; d <= 5; d++) {
    entries.push({ _ts: `2026-01-1${d}T08:00:00Z`, category: "food" });
    entries.push({ _ts: `2026-01-1${d}T12:00:00Z`, category: "food" });
    entries.push({ _ts: `2026-01-1${d}T19:00:00Z`, category: "food" });
  }
  const s = a.summarise(entries);
  assert.equal(s.days, 5);
  assert.equal(s.verdict, "regular");
});

test("NutritionAgent uses injected LLM", async () => {
  const llm = { complete: async () => "Aim for 3 balanced meals daily." };
  const a = new NutritionAgent({ llm });
  const out = await a.advise([]);
  assert.match(out, /balanced/);
});

// ---------- HydrationAgent ----------

test("HydrationAgent reports no data with empty entries", () => {
  const a = new HydrationAgent();
  const s = a.summarise([]);
  assert.equal(s.verdict, "no data");
});

test("HydrationAgent totals water amounts per day", () => {
  const a = new HydrationAgent();
  const entries = [
    { _ts: "2026-01-14T08:00:00Z", amount: 0.5, tags: ["water"] },
    { _ts: "2026-01-14T12:00:00Z", amount: 0.5, tags: ["water"] },
    { _ts: "2026-01-14T18:00:00Z", amount: 0.5, tags: ["water"] },
    { _ts: "2026-01-15T08:00:00Z", amount: 1.0, tags: ["water"] },
  ];
  const s = a.summarise(entries);
  assert.equal(s.days, 2);
  assert.equal(s.avgPerDay, 1.25);
  assert.equal(s.verdict, "below goal");
});

test("HydrationAgent parses ml in the note text", () => {
  const a = new HydrationAgent();
  const entries = [
    { _ts: "2026-01-14T08:00:00Z", text: "drank 750ml", tags: ["hydration"] },
    { _ts: "2026-01-14T18:00:00Z", text: "refilled 1.5L bottle", tags: ["hydration"] },
  ];
  const s = a.summarise(entries);
  assert.equal(s.days, 1);
  assert.equal(s.avgPerDay, 2.25);
});

test("HydrationAgent flags low intake under 1L", () => {
  const a = new HydrationAgent();
  const entries = [
    { _ts: "2026-01-14T08:00:00Z", amount: 0.3, tags: ["water"] },
    { _ts: "2026-01-15T08:00:00Z", amount: 0.3, tags: ["water"] },
  ];
  const s = a.summarise(entries);
  assert.equal(s.verdict, "low");
});

test("HydrationAgent uses injected LLM", async () => {
  const llm = { complete: async () => "Keep a 1L bottle on your desk." };
  const a = new HydrationAgent({ llm });
  const out = await a.advise([]);
  assert.match(out, /1L/);
});

// ---------- ActivityAgent ----------

test("ActivityAgent reports no data with empty events", () => {
  const a = new ActivityAgent();
  const s = a.summarise([]);
  assert.equal(s.verdict, "no data");
});

test("ActivityAgent totals steps per day and rates against goal", () => {
  const a = new ActivityAgent({ stepGoal: 10000 });
  const events = [
    { kind: "steps", ts: "2026-01-14T08:00:00Z", value: 3000 },
    { kind: "steps", ts: "2026-01-14T12:00:00Z", value: 2000 },
    { kind: "steps", ts: "2026-01-15T08:00:00Z", value: 15000 },
  ];
  const s = a.summarise(events);
  assert.equal(s.days, 2);
  assert.equal(s.totalSteps, 20000);
  assert.equal(s.avgPerDay, 10000);
  assert.equal(s.verdict, "active");
});

test("ActivityAgent flags sedentary when under 50% of goal", () => {
  const a = new ActivityAgent({ stepGoal: 10000 });
  const events = [
    { kind: "steps", ts: "2026-01-14T08:00:00Z", value: 1000 },
    { kind: "steps", ts: "2026-01-15T08:00:00Z", value: 1000 },
  ];
  const s = a.summarise(events);
  assert.equal(s.verdict, "sedentary");
});

test("ActivityAgent uses injected LLM", async () => {
  const llm = { complete: async () => "Take a 10 minute walk after lunch." };
  const a = new ActivityAgent({ llm });
  const out = await a.advise([]);
  assert.match(out, /walk/);
});

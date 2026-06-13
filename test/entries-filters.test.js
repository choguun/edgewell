import test from "node:test";
import assert from "node:assert/strict";

// Smoke test: verify that several entries-filter command files
// can be imported. This catches a broken dispatch wiring early.

test("entries-filter command modules can be imported", async () => {
  const files = [
    "journal-entries-month-N",
    "journal-entries-year-N",
    "journal-entries-week-N",
    "journal-entries-day-of-week",
    "journal-entries-month-of-year",
    "journal-entries-day-of-year",
    "journal-entries-half-year",
    "journal-entries-quarter-of-year",
    "journal-entries-last-N-weeks",
    "journal-entries-last-N-months",
    "journal-entries-last-N-years",
    "expenses-entries-month-N",
    "expenses-entries-year-N",
    "expenses-entries-year-month",
    "expenses-entries-day-of-week",
    "expenses-entries-month-of-year",
  ];
  for (const f of files) {
    const mod = await import(`../src/commands/${f}.js`);
    const exports = Object.values(mod);
    assert.ok(exports.length > 0, `${f}.js must export at least one function`);
    assert.equal(typeof exports[0], "function", `${f}.js must export a function`);
  }
});

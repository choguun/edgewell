import { test } from "node:test";
import assert from "node:assert/strict";
import { validateRecord, ValidationError } from "../src/schema.js";
import { JOURNAL_SCHEMA, EXPENSE_SCHEMA } from "../src/schemas.js";

test("validateRecord accepts a valid journal entry", () => {
  const v = validateRecord<{ kind: string; text: string; mood?: string }>(
    { kind: "journal", text: "hello", mood: "good" },
    JOURNAL_SCHEMA,
  );
  assert.equal(v.kind, "journal");
});

test("validateRecord rejects a journal entry with bad mood", () => {
  assert.throws(
    () => validateRecord({ kind: "journal", text: "hi", mood: "ecstatic" }, JOURNAL_SCHEMA),
    ValidationError,
  );
});

test("validateRecord rejects an expense with negative amount", () => {
  assert.throws(
    () => validateRecord({ kind: "expense", amount: -10, category: "food" }, EXPENSE_SCHEMA),
    ValidationError,
  );
});

test("validateRecord accepts a valid expense", () => {
  validateRecord({ kind: "expense", amount: 9.5, category: "food", currency: "USD" }, EXPENSE_SCHEMA);
});

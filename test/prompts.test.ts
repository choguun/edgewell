// @ts-nocheck
// Tests for the prompt template library.

import { test } from "node:test";
import assert from "node:assert/strict";
import { TEMPLATES, renderTemplate } from "../src/prompts.js";

test("renderTemplate includes the user's question", () => {
  const out = renderTemplate("health", { question: "How should I sleep?" });
  assert.match(out, /How should I sleep\?/);
});

test("renderTemplate includes journal entries when provided", () => {
  const out = renderTemplate("health", {
    question: "Anything to improve?",
    journal: [{ _ts: "2026-01-15T08:00:00Z", text: "slept 7h" }],
  });
  assert.match(out, /slept 7h/);
});

test("renderTemplate substitutes an empty RAG context cleanly", () => {
  const out = renderTemplate("health", { question: "x", ragContext: "" });
  assert.match(out, /\(none\)/);
});

test("renderTemplate finance includes expense rows", () => {
  const out = renderTemplate("finance", {
    question: "How am I doing?",
    expenses: [{ _ts: "2026-01-15T08:00:00Z", category: "food", amount: 5 }],
  });
  assert.match(out, /food/);
  assert.match(out, /5/);
});

test("renderTemplate sleep computes total hours", () => {
  const out = renderTemplate("sleep", { events: [{ value: 60 * 7 }] });
  assert.match(out, /7\.00 hours/);
});

test("renderTemplate throws on unknown template", () => {
  assert.throws(() => renderTemplate("bogus", {}), /unknown template/);
});

test("TEMPLATES exposes the three agent names", () => {
  assert.ok(TEMPLATES.health);
  assert.ok(TEMPLATES.finance);
  assert.ok(TEMPLATES.sleep);
});

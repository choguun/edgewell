// Tests for the sample-journal and sample-questions CLI commands.

import { test } from "node:test";
import assert from "node:assert/strict";
import { sampleQuestionsCommand } from "../src/commands/sample-questions.js";

test("sample-questions prints at least 5 numbered questions", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await sampleQuestionsCommand([]);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  // Should have at least 5 questions
  const matches = text.match(/^\s+\d+\./gm) ?? [];
  assert.ok(matches.length >= 5);
  // Should mention "sleep" or "water" or "saving" (some common topics)
  assert.ok(/sleep|water|saving|meal/i.test(text));
});

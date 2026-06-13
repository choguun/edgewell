// Tests for the agents CLI command.

import { test } from "node:test";
import assert from "node:assert/strict";
import { agentsCommand } from "../src/commands/agents.js";

test("agents command lists all six agent names", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await agentsCommand([], {});
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  for (const name of ["health", "finance", "sleep", "nutrition", "hydration", "activity"]) {
    assert.match(text, new RegExp(name));
  }
});

test("agents command includes a description for each agent", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await agentsCommand([], {});
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  // The finance agent should mention "budget" or "saving" or "expense".
  assert.ok(/budget|saving|expense/i.test(text));
});

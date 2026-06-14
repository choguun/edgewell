// @ts-nocheck
// Tests for the seed CLI command.

import { test } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { seedCommand } from "../src/commands/seed.js";

async function makeTempStore() {
  const dir = await fs.mkdtemp(join(tmpdir(), "edgewell-seed-"));
  const file = join(dir, "data.jsonl");
  const appended = [];
  const store = {
    readAll: async () => appended,
    append: async (e) => appended.push(e),
  };
  return { dir, file, store, appended };
}

test("seed appends the requested number of journal entries", async () => {
  const { store, appended } = await makeTempStore();
  const origLog = console.log;
  console.log = () => {};
  try {
    await seedCommand(["3"], { journal: store, expenses: store });
  } finally {
    console.log = origLog;
  }
  // 3 journal + 3 expenses = 6 total
  assert.equal(appended.length, 6);
  for (const e of appended) {
    assert.ok(e._ts);
    assert.ok(typeof e.amount === "number" || typeof e.text === "string");
  }
});

test("seed is idempotent (re-running adds nothing)", async () => {
  const { store, appended } = await makeTempStore();
  const origLog = console.log;
  console.log = () => {};
  let firstRun = 0;
  try {
    await seedCommand(["2"], { journal: store, expenses: store });
    firstRun = appended.length;
    await seedCommand(["2"], { journal: store, expenses: store });
  } finally {
    console.log = origLog;
  }
  // The second run should not add anything because every key is
  // already present.
  assert.equal(appended.length, firstRun);
});

test("seed rejects a non-numeric count", async () => {
  const { store } = await makeTempStore();
  const origLog = console.log;
  const origErr = console.error;
  const origExit = process.exit;
  let code = 0;
  console.log = () => {};
  console.error = () => {};
  process.exit = (c) => {
    code = c;
    throw new Error("__exit__");
  };
  try {
    await seedCommand(["bogus"], { journal: store, expenses: store });
  } catch (err) {
    if (err.message !== "__exit__") throw err;
  } finally {
    console.log = origLog;
    console.error = origErr;
    process.exit = origExit;
  }
  assert.equal(code, 2);
});

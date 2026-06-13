// Tests for the compare CLI command.

import { test } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { compareCommand } from "../src/commands/compare.js";

async function makeTempJson(content) {
  const dir = await fs.mkdtemp(join(tmpdir(), "edgewell-cmp-"));
  const file = join(dir, "export.json");
  await fs.writeFile(file, JSON.stringify(content));
  return { dir, file };
}

test("compare reports +1 / -1 journal entries", async () => {
  const a = await makeTempJson({
    version: "2.0.0",
    exportedAt: "2026-01-10T00:00:00Z",
    journal: [{ _ts: "2026-01-10T08:00:00Z", text: "old" }],
    expenses: [],
  });
  const b = await makeTempJson({
    version: "3.0.0",
    exportedAt: "2026-01-22T00:00:00Z",
    journal: [
      { _ts: "2026-01-10T08:00:00Z", text: "old" },
      { _ts: "2026-01-22T08:00:00Z", text: "new" },
    ],
    expenses: [],
  });
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await compareCommand([a.file, b.file]);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /journal:\s*\+1/);
  assert.match(text, /-0/);
  await fs.rm(a.dir, { recursive: true });
  await fs.rm(b.dir, { recursive: true });
});

test("compare handles missing args with exit code 2", async () => {
  const orig = console.error;
  const origExit = process.exit;
  let code = 0;
  console.error = () => {};
  process.exit = (c) => {
    code = c;
    throw new Error("__exit__");
  };
  try {
    await compareCommand(["only-one"]);
  } catch (err) {
    if (err.message !== "__exit__") throw err;
  } finally {
    console.error = orig;
    process.exit = origExit;
  }
  assert.equal(code, 2);
});

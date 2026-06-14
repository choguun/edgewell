// @ts-nocheck
// Tests for the snapshot-validate, snapshot-sign, and
// snapshot-verify CLI commands.

import { test } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { snapshotValidateCommand } from "../src/commands/snapshot-validate.js";
import { snapshotSignCommand } from "../src/commands/snapshot-sign.js";
import { snapshotVerifyCommand } from "../src/commands/snapshot-verify.js";

async function tempFile(content) {
  const dir = await fs.mkdtemp(join(tmpdir(), "edgewell-snap-"));
  const file = join(dir, "snap.json");
  await fs.writeFile(file, content);
  return { dir, file };
}

test("snapshot-validate accepts a valid snapshot", async () => {
  const { file, dir } = await tempFile(JSON.stringify({ journal: [], expenses: [], version: "3.0.0" }));
  const orig = console.log;
  console.log = () => {};
  try {
    await snapshotValidateCommand([file]);
  } finally {
    console.log = orig;
  }
  await fs.rm(dir, { recursive: true });
});

test("snapshot-validate rejects a non-object root", async () => {
  const { file, dir } = await tempFile("42");
  const orig = console.log;
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
    await snapshotValidateCommand([file]);
  } catch (err) {
    if (err.message !== "__exit__") throw err;
  } finally {
    console.log = orig;
    console.error = origErr;
    process.exit = origExit;
  }
  assert.equal(code, 1);
  await fs.rm(dir, { recursive: true });
});

test("snapshot-sign and snapshot-verify round-trip", async () => {
  const { file, dir } = await tempFile(JSON.stringify({ journal: [], expenses: [] }));
  const orig = console.log;
  console.log = () => {};
  try {
    await snapshotSignCommand([file]);
    await snapshotVerifyCommand([file]);
  } finally {
    console.log = orig;
  }
  const sidecar = await fs.readFile(`${file}.sha256`, "utf8");
  assert.match(sidecar, /^[0-9a-f]{64}  /);
  await fs.rm(dir, { recursive: true });
});

test("snapshot-verify detects a tampered file", async () => {
  const { file, dir } = await tempFile(JSON.stringify({ journal: [], expenses: [] }));
  const orig = console.log;
  const origExit = process.exit;
  let code = 0;
  console.log = () => {};
  process.exit = (c) => {
    code = c;
    throw new Error("__exit__");
  };
  try {
    await snapshotSignCommand([file]);
    // Tamper with the file.
    await fs.writeFile(file, JSON.stringify({ journal: [{ _ts: "t", text: "bad" }], expenses: [] }));
    await snapshotVerifyCommand([file]);
  } catch (err) {
    if (err.message !== "__exit__") throw err;
  } finally {
    console.log = orig;
    process.exit = origExit;
  }
  assert.equal(code, 1);
  await fs.rm(dir, { recursive: true });
});

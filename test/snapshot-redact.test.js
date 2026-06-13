// Tests for the snapshot-redact CLI command.

import { test } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { snapshotRedactCommand } from "../src/commands/snapshot-redact.js";

async function makeTempFile(content) {
  const dir = await fs.mkdtemp(join(tmpdir(), "edgewell-redact-"));
  const inFile = join(dir, "in.json");
  const outFile = join(dir, "out.json");
  await fs.writeFile(inFile, JSON.stringify(content));
  return { dir, inFile, outFile };
}

test("snapshot-redact masks emails in strings", async () => {
  const { dir, inFile, outFile } = await makeTempFile({
    journal: [{ _ts: "2026-01-01T00:00:00Z", text: "ping me at ada@example.com" }],
  });
  const orig = console.log;
  console.log = () => {};
  try {
    await snapshotRedactCommand([inFile, outFile]);
  } finally {
    console.log = orig;
  }
  const out = JSON.parse(await fs.readFile(outFile, "utf8"));
  assert.match(out.journal[0].text, /\[REDACTED/);
  assert.ok(!out.journal[0].text.includes("ada@example.com"));
  await fs.rm(dir, { recursive: true });
});

test("snapshot-redact handles missing args with exit code 2", async () => {
  const origErr = console.error;
  const origExit = process.exit;
  let code = 0;
  console.error = () => {};
  process.exit = (c) => {
    code = c;
    throw new Error("__exit__");
  };
  try {
    await snapshotRedactCommand(["only-one"]);
  } catch (err) {
    if (err.message !== "__exit__") throw err;
  } finally {
    console.error = origErr;
    process.exit = origExit;
  }
  assert.equal(code, 2);
});

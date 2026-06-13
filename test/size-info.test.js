// Tests for the size and info CLI commands.

import { test } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { sizeCommand } from "../src/commands/size.js";
import { infoCommand } from "../src/commands/info.js";

async function makeTempDir() {
  return await fs.mkdtemp(join(tmpdir(), "edgewell-size-"));
}

test("size command reports zero for an empty data dir", async () => {
  const dir = await makeTempDir();
  const ew = {
    cfg: {
      data: { dir, profileFile: "profile.json", journalFile: "journal.jsonl", expensesFile: "expenses.jsonl" },
      rag: { dir: "rag" },
    },
  };
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await sizeCommand([], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /total/);
  assert.match(text, /0 B/);
  await fs.rm(dir, { recursive: true });
});

test("size command reports non-zero for a populated file", async () => {
  const dir = await makeTempDir();
  const file = join(dir, "journal.jsonl");
  await fs.writeFile(file, '{"_ts":"t","text":"hello world"}\n');
  const ew = {
    cfg: {
      data: { dir, profileFile: "profile.json", journalFile: "journal.jsonl", expensesFile: "expenses.jsonl" },
      rag: { dir: "rag" },
    },
  };
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await sizeCommand([], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  // The journal line is ~34 bytes, so we expect a non-zero figure.
  assert.ok(/[1-9][0-9]* B/.test(text), `expected non-zero bytes, got: ${text}`);
  await fs.rm(dir, { recursive: true });
});

test("info command prints version from package.json", async () => {
  const ew = {
    cfg: { data: { dir: "/tmp" } },
    journal: { readAll: async () => [] },
    expenses: { readAll: async () => [] },
    rag: { _ensure: async () => {}, chunks: [] },
  };
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await infoCommand([], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /3\.0\.0/);
  assert.match(text, /node:/);
  assert.match(text, /journal:/);
});

test("info command with --all shows extra detail", async () => {
  const ew = {
    cfg: { data: { dir: "/tmp" } },
    journal: { readAll: async () => [] },
    expenses: { readAll: async () => [] },
    rag: { _ensure: async () => {}, chunks: [] },
  };
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await infoCommand(["--all"], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /agents:/);
  assert.match(text, /mobile/);
});

// Tests for the doctor command's v3.0.0 subsystem checks.

import { test } from "node:test";
import assert from "node:assert/strict";
import { doctorCommand } from "../src/commands/doctor.js";

function makeEw() {
  return {
    cfg: {
      version: "3.0.0",
      data: { dir: "/tmp", profileFile: "profile.json", journalFile: "journal.jsonl", expensesFile: "expenses.jsonl" },
      rag: { dir: "rag", chunkSize: 400, chunkOverlap: 50, topK: 4 },
      p2p: { enabled: false, host: "127.0.0.1", port: 8787 },
    },
    rag: { _ensure: async () => {}, chunks: [{ source: "a", text: "hello" }] },
    profile: { load: async () => ({ name: "ada", language: "en" }) },
    journal: { count: async () => 0 },
    expenses: { count: async () => 0 },
  };
}

test("doctor runs and prints v3.0.0 subsystem checks", async () => {
  const logs = [];
  const origLog = console.log;
  const origExit = process.exit;
  console.log = (...args) => logs.push(args.join(" "));
  process.exit = (code) => {
    // Don't actually exit; the test would never return.
    if (code !== 0) throw new Error(`__exit_${code}__`);
  };
  try {
    await doctorCommand([], makeEw());
  } catch (err) {
    if (!/^__exit_/.test(err.message)) throw err;
  } finally {
    console.log = origLog;
    process.exit = origExit;
  }
  const text = logs.join("\n");
  assert.match(text, /vector index available/);
  assert.match(text, /hybrid search available/);
  assert.match(text, /profiles registered/);
  assert.match(text, /plugin loader v2/);
});

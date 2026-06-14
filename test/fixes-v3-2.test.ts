// @ts-nocheck
// Regression tests for the second E2E sweep. Each test pins
// down one of the input-validation / error-handling / hardening
// bugs that the sweep found.

import { test } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parseFlags, promptLine } from "../src/cli.js";
import { expenseCommand } from "../src/commands/expense.js";
import { lintCommand } from "../src/commands/lint.js";
import { importCommand } from "../src/commands/import.js";
import { redact } from "../src/redact.js";
import { runBenchmark, formatBenchResult } from "../src/bench-harness.js";
import { seedCommand } from "../src/commands/seed.js";

const exec = promisify(execFile);
const CLI = join(import.meta.dirname, "..", "bin", "edgewell.js");

function silent() {
  const origLog = console.log;
  const origErr = console.error;
  console.log = () => {};
  console.error = () => {};
  return () => {
    console.log = origLog;
    console.error = origErr;
  };
}

test("expense add rejects negative amounts with exit 2", async () => {
  const restore = silent();
  const ew = { expenses: { append: async () => { throw new Error("should not be called"); } } };
  let exitCode = 0;
  const origExit = process.exit;
  process.exit = (c) => { exitCode = c; throw new Error("__exit__"); };
  try {
    await expenseCommand(["add", "-1", "food"], ew);
  } catch (err) {
    if (err.message !== "__exit__") throw err;
  } finally {
    process.exit = origExit;
    restore();
  }
  assert.equal(exitCode, 2);
});

test("expense add rejects amounts above EXPENSE_MAX with exit 2", async () => {
  const restore = silent();
  const ew = { expenses: { append: async () => { throw new Error("should not be called"); } } };
  let exitCode = 0;
  const origExit = process.exit;
  process.exit = (c) => { exitCode = c; throw new Error("__exit__"); };
  try {
    await expenseCommand(["add", "1e20", "food"], ew);
  } catch (err) {
    if (err.message !== "__exit__") throw err;
  } finally {
    process.exit = origExit;
    restore();
  }
  assert.equal(exitCode, 2);
});

test("expense add accepts in-range amounts", async () => {
  const restore = silent();
  let appended = null;
  const ew = { expenses: { append: async (e) => { appended = e; } } };
  await expenseCommand(["add", "10", "food"], ew);
  restore();
  assert.ok(appended);
  assert.equal(appended.amount, 10);
  assert.equal(appended.kind, "expense");
});

test("parseFlags handles --key=value syntax", () => {
  assert.deepEqual(parseFlags(["--port=8788"]).port, "8788");
  assert.deepEqual(parseFlags(["--port=-1"]).port, "-1");
  assert.deepEqual(parseFlags(["--port=80=80"]).port, "80=80");
});

test("parseFlags still handles --key value (space form)", () => {
  assert.deepEqual(parseFlags(["--port", "8787"]).port, "8787");
  assert.deepEqual(parseFlags(["--port", "--host", "1"]).port, true);
});

test("parseFlags treats bare --flag as boolean", () => {
  assert.deepEqual(parseFlags(["--no-color"])["no-color"], true);
});

test("lint flags negative and out-of-range amounts", async () => {
  const restore = silent();
  const logs = [];
  const orig = console.log;
  console.log = (...a) => logs.push(a.join(" "));
  try {
    await lintCommand([], {
      journal: { readAll: async () => [] },
      expenses: { readAll: async () => [
        { _ts: "t", amount: -5, category: "food" },
        { _ts: "t", amount: 1e15, category: "food" },
      ] },
    });
  } finally {
    console.log = orig;
    restore();
  }
  const out = logs.join("\n");
  assert.match(out, /negative amount/);
  assert.match(out, /out-of-range amount/);
});

test("lint flags whitespace-only and empty text", async () => {
  const restore = silent();
  const logs = [];
  const orig = console.log;
  console.log = (...a) => logs.push(a.join(" "));
  try {
    await lintCommand([], {
      journal: { readAll: async () => [
        { _ts: "t", text: "" },
        { _ts: "t", text: "   " },
        { _ts: "t", text: "line1\nline2" },
        { _ts: "t" },  // missing text entirely
      ] },
      expenses: { readAll: async () => [] },
    });
  } finally {
    console.log = orig;
    restore();
  }
  const out = logs.join("\n");
  assert.match(out, /empty text/);
  assert.match(out, /whitespace-only text/);
  assert.match(out, /newline in text/);
  assert.match(out, /missing text/);
});

test("redact handles non-ASCII email local parts", () => {
  assert.equal(redact("你好@example.com"), "[REDACTED_EMAIL]");
  assert.equal(redact("ada@example.com"), "[REDACTED_EMAIL]");
});

test("redact handles URLs with embedded credentials", () => {
  const out = redact("see https://user:hunter2@api.example.com/v1");
  // The email rule fires first and redacts user:pass@example.com to
  // [REDACTED_EMAIL], which hides the password. That's the desired
  // outcome.
  assert.ok(!out.includes("hunter2"), `password leaked: ${out}`);
});

test("runBenchmark rejects trials <= 0", async () => {
  await assert.rejects(() => runBenchmark({ name: "x", fn: async () => {}, trials: 0 }), /trials/);
  await assert.rejects(() => runBenchmark({ name: "x", fn: async () => {}, trials: -1 }), /trials/);
  await assert.rejects(() => runBenchmark({ name: "x", fn: async () => {}, warmup: -1 }), /warmup/);
});

test("runBenchmark isolates per-trial failures and reports them", async () => {
  let i = 0;
  const r = await runBenchmark({
    name: "flaky",
    fn: async () => { if (i++ % 2 === 0) throw new Error("boom"); },
    trials: 4,
    warmup: 0,
  });
  assert.equal(r.ok, true);  // at least some trials succeeded
  assert.equal(r.samples.length, 2);
  assert.equal(r.failures.length, 2);
});

test("runBenchmark reports all-fail with ok=false", async () => {
  const r = await runBenchmark({
    name: "doomed",
    fn: async () => { throw new Error("nope"); },
    trials: 3,
    warmup: 0,
  });
  assert.equal(r.ok, false);
  assert.equal(r.samples.length, 0);
  assert.equal(r.failures.length, 3);
  // format should mention the failure
  const out = formatBenchResult(r);
  assert.match(out, /ALL 3 TRIALS FAILED/);
});

test("import rejects a file that is not valid JSON with a clear error", async () => {
  const restore = silent();
  const dir = await mkdtemp(join(process.env.TMPDIR ?? "/tmp", "edgewell-imp-"));
  const file = join(dir, "bad.json");
  await writeFile(file, "this is not json");
  let exitCode = 0;
  const origExit = process.exit;
  process.exit = (c) => { exitCode = c; throw new Error("__exit__"); };
  const logs = [];
  const origErr = console.error;
  console.error = (...a) => logs.push(a.join(" "));
  try {
    await importCommand([file], { journal: { readAll: async () => [], append: async () => {}, filePath: null }, expenses: { readAll: async () => [], append: async () => {}, filePath: null } });
  } catch (err) {
    if (err.message !== "__exit__") throw err;
  } finally {
    process.exit = origExit;
    console.error = origErr;
    restore();
    await fs.rm(dir, { recursive: true, force: true });
  }
  assert.equal(exitCode, 1);
  const combined = logs.join("\n");
  assert.match(combined, /not a valid JSON file/);
});

test("import rejects a non-existent file", async () => {
  const restore = silent();
  let exitCode = 0;
  const origExit = process.exit;
  process.exit = (c) => { exitCode = c; throw new Error("__exit__"); };
  const logs = [];
  const origErr = console.error;
  console.error = (...a) => logs.push(a.join(" "));
  try {
    await importCommand(["/no/such/file.json"], { journal: { readAll: async () => [], append: async () => {}, filePath: null }, expenses: { readAll: async () => [], append: async () => {}, filePath: null } });
  } catch (err) {
    if (err.message !== "__exit__") throw err;
  } finally {
    process.exit = origExit;
    console.error = origErr;
    restore();
  }
  assert.equal(exitCode, 1);
  const combined = logs.join("\n");
  assert.match(combined, /file not found/);
});

test("seed command never produces negative or out-of-range amounts", async () => {
  const restore = silent();
  const calls = [];
  const ew = {
    journal: { readAll: async () => [], append: async () => {} },
    expenses: { readAll: async () => [], append: async (e) => calls.push(e) },
  };
  await seedCommand(["100"], ew);
  restore();
  for (const e of calls) {
    assert.ok(Number.isFinite(e.amount), `non-finite amount: ${e.amount}`);
    assert.ok(e.amount >= 0, `negative amount: ${e.amount}`);
    assert.ok(e.amount <= 1_000_000_000, `out-of-range amount: ${e.amount}`);
  }
});

test("promptLine does not crash when stdin is not a TTY", async () => {
  // We can't easily make this test the real stdin, but we can call
  // the function with a synthetic pipe.
  const { Readable } = await import("node:stream");
  const fakeStdin = Readable.from(["hello\n"]);
  const origStdin = process.stdin;
  Object.defineProperty(process, "stdin", { value: fakeStdin, configurable: true });
  try {
    const out = await promptLine("> ");
    assert.equal(out, "hello");
  } finally {
    Object.defineProperty(process, "stdin", { value: origStdin, configurable: true });
  }
});

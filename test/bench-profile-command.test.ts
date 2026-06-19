// @ts-nocheck
// Tests for the `edgewell bench-profile` CLI command.
//
// The bench-profile command runs the same three operations
// (rag.search, Orchestrator.route, vector.search) against each
// of the three form-factor profiles (mobile, tinkerer, desktop)
// and prints an ASCII table with the per-profile medians plus
// an "expected tok/s" column built from a static ESTIMATED table
// keyed on real model ids from src/registry.ts.
//
// These tests load the handler dynamically so a missing
// `src/commands/bench-profile.ts` produces a clear import-time
// error rather than a confusing parse-time crash.

import { test, before } from "node:test";
import assert from "node:assert/strict";

// ----------------------------------------------------------------------------
// Dynamic import — store either the loaded handler or the load error so each
// test can produce a precise failure message instead of a generic "before
// hook threw" diagnostic.
// ----------------------------------------------------------------------------

type HandlerFn = (argv?: unknown, ew?: unknown) => unknown | Promise<unknown>;

let handler: HandlerFn | undefined;
let loadError: unknown;

before(async () => {
  try {
    const mod = (await import("../src/commands/bench-profile.js")) as Record<string, unknown>;
    // Accept either the yargs-style `{ command, describe, builder, handler }`
    // named export, the function-style `benchProfileCommand` named export, or
    // a default export — same convention as showcase-command.test.ts.
    const candidate = mod.handler ?? mod.benchProfileCommand ?? mod.default;
    if (typeof candidate === "function") {
      handler = candidate as HandlerFn;
    } else {
      loadError = new Error(
        "src/commands/bench-profile.js must export a `handler` function " +
          "(or `benchProfileCommand` / default function)",
      );
    }
  } catch (err) {
    loadError = err;
  }
});

// ----------------------------------------------------------------------------
// Helper: run the handler with monkey-patched console.log and return the
// captured output as a single string. Awaited even if the handler is sync.
// The handler is safe to invoke with empty / undefined args.
// ----------------------------------------------------------------------------

async function runBenchProfileAndCapture(argv: unknown = []): Promise<string> {
  const logs: string[] = [];
  const origLog = console.log;
  console.log = (...args: unknown[]) => {
    logs.push(args.map((a) => (typeof a === "string" ? a : String(a))).join(" "));
  };
  try {
    const fn = handler as unknown as (a: unknown, ew?: unknown) => unknown | Promise<unknown>;
    const out = fn(argv, undefined);
    if (out && typeof (out as { then?: unknown }).then === "function") {
      await (out as Promise<unknown>);
    }
    return logs.join("\n");
  } finally {
    console.log = origLog;
  }
}

// ----------------------------------------------------------------------------
// Tests — the 4 assertions required by the bench-profiler task.
// ----------------------------------------------------------------------------

test("bench-profile command module loads", () => {
  if (loadError) {
    const msg = (loadError as Error)?.message ?? String(loadError);
    assert.fail(`failed to load bench-profile command: ${msg}`);
  }
  assert.equal(
    typeof handler,
    "function",
    "expected src/commands/bench-profile.js to export a function handler",
  );
});

test("bench-profile handler does not throw on default args", async () => {
  if (loadError) {
    const msg = (loadError as Error)?.message ?? String(loadError);
    assert.fail(`bench-profile command not loaded: ${msg}`);
  }
  // runBenchProfileAndCapture re-raises any thrown error; if it returns
  // normally the handler is exception-free for the default-args call.
  await runBenchProfileAndCapture([]);
});

test("bench-profile output contains all three profile names: mobile, tinkerer, desktop", async () => {
  if (loadError) {
    const msg = (loadError as Error)?.message ?? String(loadError);
    assert.fail(`bench-profile command not loaded: ${msg}`);
  }
  const text = await runBenchProfileAndCapture([]);
  for (const name of ["mobile", "tinkerer", "desktop"]) {
    assert.match(
      text,
      new RegExp(name),
      `expected bench-profile output to include the profile name "${name}"`,
    );
  }
});

test("bench-profile output contains the 'expected tok/s' substring (ASCII table rendered)", async () => {
  if (loadError) {
    const msg = (loadError as Error)?.message ?? String(loadError);
    assert.fail(`bench-profile command not loaded: ${msg}`);
  }
  const text = await runBenchProfileAndCapture([]);
  assert.match(
    text,
    /expected tok\/s/,
    "expected bench-profile output to include the ASCII table header 'expected tok/s'",
  );
});

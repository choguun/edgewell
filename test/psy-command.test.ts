// @ts-nocheck
// Tests for the `edgewell psy` CLI command.
//
// The psy command prints the Psy-family model catalog and the
// domain-aware routing decisions for three representative
// mental-health questions, using a clearly-marked hackathon
// stub LLM so it runs without the live QVAC SDK. It exposes
//   1. `psyCommand`         — the function-style entrypoint
//   2. `handler`            — yargs-style dispatcher shape
//   3. `default`            — default export
//   4. `_internal`          — listPsyModels / routePsyQuestion /
//                              psyStubLLM for direct assertion
//
// Tests load the module dynamically so a missing file produces
// a clear import-time error rather than a parse-time crash
// (mirrors test/showcase-command.test.ts).

import { test, before } from "node:test";
import assert from "node:assert/strict";

// ----------------------------------------------------------------------------
// Dynamic import — store either the loaded handler or the load error so each
// test can produce a precise failure message.
// ----------------------------------------------------------------------------

type HandlerFn = (argv?: unknown) => unknown | Promise<unknown>;

let handler: HandlerFn | undefined;
let mod: Record<string, unknown> | undefined;
let loadError: unknown;

before(async () => {
  try {
    const m = (await import("../src/commands/psy.js")) as Record<string, unknown>;
    mod = m;
    const candidate = m.handler ?? m.psyCommand ?? m.default;
    if (typeof candidate === "function") {
      handler = candidate as HandlerFn;
    } else {
      loadError = new Error(
        "src/commands/psy.js must export a `handler` function " +
          "(or `psyCommand` / default function)",
      );
    }
  } catch (err) {
    loadError = err;
  }
});

// ----------------------------------------------------------------------------
// Helper: run the handler with monkey-patched console.log and return the
// captured output as a single string. Awaited even if the handler is sync.
// ----------------------------------------------------------------------------

async function runPsyAndCapture(argv: unknown = {}): Promise<string> {
  const logs: string[] = [];
  const origLog = console.log;
  console.log = (...args: unknown[]) => {
    logs.push(args.map((a) => (typeof a === "string" ? a : String(a))).join(" "));
  };
  try {
    const fn = handler as unknown as (a: unknown) => unknown | Promise<unknown>;
    const out = fn(argv);
    if (out && typeof (out as { then?: unknown }).then === "function") {
      await (out as Promise<unknown>);
    }
    return logs.join("\n");
  } finally {
    console.log = origLog;
  }
}

// ----------------------------------------------------------------------------
// Tests (5 assertions, mirroring the showcase-command test shape).
// ----------------------------------------------------------------------------

test("psy command module loads", () => {
  if (loadError) {
    const msg = (loadError as Error)?.message ?? String(loadError);
    assert.fail(`failed to load psy command: ${msg}`);
  }
  assert.equal(
    typeof handler,
    "function",
    "expected src/commands/psy.js to export a function handler",
  );
});

test("psy handler does not throw on default args", async () => {
  if (loadError) {
    const msg = (loadError as Error)?.message ?? String(loadError);
    assert.fail(`psy command not loaded: ${msg}`);
  }
  // runPsyAndCapture re-raises any thrown error; if it returns
  // normally the handler is exception-free.
  await runPsyAndCapture({});
});

test("psy output contains at least one MEDPSY_ model id", async () => {
  if (loadError) {
    const msg = (loadError as Error)?.message ?? String(loadError);
    assert.fail(`psy command not loaded: ${msg}`);
  }
  const text = await runPsyAndCapture({});
  assert.match(
    text,
    /MEDPSY_/,
    "expected psy output to include at least one MEDPSY_ model id",
  );
});

test("psy output references domain=medical in the routing decision", async () => {
  if (loadError) {
    const msg = (loadError as Error)?.message ?? String(loadError);
    assert.fail(`psy command not loaded: ${msg}`);
  }
  const text = await runPsyAndCapture({});
  // Accept either the `domain=medical` literal (printed by the
  // routing-decision block) or the bare `medical` keyword that
  // appears in the catalog's `domain=medical` column.
  const hasLiteral = /domain=medical/.test(text);
  const hasWord = /\bmedical\b/.test(text);
  assert.ok(
    hasLiteral || hasWord,
    "expected psy output to include the substring `domain=medical` (or `medical`)",
  );
});

test("psy output contains the substring Psy or psy", async () => {
  if (loadError) {
    const msg = (loadError as Error)?.message ?? String(loadError);
    assert.fail(`psy command not loaded: ${msg}`);
  }
  const text = await runPsyAndCapture({});
  // Header line and summary both contain "Psy"; case-insensitive
  // match keeps the test robust against minor formatting tweaks.
  assert.match(
    text,
    /Psy|psy/,
    "expected psy output to contain the substring `Psy` (or `psy`)",
  );
});

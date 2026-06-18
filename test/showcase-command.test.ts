// @ts-nocheck
// Tests for the `edgewell showcase` CLI command.
//
// The showcase command prints a short demo of the multi-agent
// orchestrator + tool-calling flow without needing the real
// QVAC SDK or a live P2P peer. It exercises:
//
//   - the router (one decision per question)
//   - the Orchestrator dispatching to health / finance / lifestyle
//   - the ToolAgent loop with the calculator + search_kb tools
//   - the [p2p] peer-unreachable → fallback warning
//
// These tests load the handler dynamically so a missing
// `src/commands/showcase.ts` produces a clear import-time error
// rather than a confusing parse-time crash.

import { test, before } from "node:test";
import assert from "node:assert/strict";

// ----------------------------------------------------------------------------
// Dynamic import — store either the loaded handler or the load error so each
// test can produce a precise failure message instead of a generic "before
// hook threw" diagnostic.
// ----------------------------------------------------------------------------

type HandlerFn = (argv?: unknown) => unknown | Promise<unknown>;

let handler: HandlerFn | undefined;
let loadError: unknown;

before(async () => {
  try {
    const mod = (await import("../src/commands/showcase.js")) as Record<string, unknown>;
    // Accept either the yargs-style `{ command, describe, builder, handler }`
    // named export, the function-style `showcaseCommand` named export (which
    // mirrors the pattern in src/commands/agents.ts), or a default export.
    const candidate = mod.handler ?? mod.showcaseCommand ?? mod.default;
    if (typeof candidate === "function") {
      handler = candidate as HandlerFn;
    } else {
      loadError = new Error(
        "src/commands/showcase.js must export a `handler` function " +
          "(or `showcaseCommand` / default function)",
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

async function runShowcaseAndCapture(argv: unknown = {}): Promise<string> {
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
// Tests
// ----------------------------------------------------------------------------

test("showcase command module loads", () => {
  if (loadError) {
    const msg = (loadError as Error)?.message ?? String(loadError);
    assert.fail(`failed to load showcase command: ${msg}`);
  }
  assert.equal(
    typeof handler,
    "function",
    "expected src/commands/showcase.js to export a function handler",
  );
});

test("showcase handler does not throw on default args", async () => {
  if (loadError) {
    const msg = (loadError as Error)?.message ?? String(loadError);
    assert.fail(`showcase command not loaded: ${msg}`);
  }
  // runShowcaseAndCapture re-raises any thrown error; if it returns
  // normally the handler is exception-free.
  await runShowcaseAndCapture({});
});

test("showcase prints router decisions for health, finance, and lifestyle", async () => {
  if (loadError) {
    const msg = (loadError as Error)?.message ?? String(loadError);
    assert.fail(`showcase command not loaded: ${msg}`);
  }
  const text = await runShowcaseAndCapture({});
  // Permissive separator: accepts `agent=health`, `agent: health`, or
  // `agent health` so the test stays robust against minor formatting
  // tweaks in the command output. The word-boundary at the end stops
  // `health` from matching `healthcare`.
  for (const name of ["health", "finance", "lifestyle"]) {
    const re = new RegExp(`agent[\\s:=]+${name}\\b`, "i");
    assert.match(
      text,
      re,
      `expected showcase output to include a router decision for "${name}"`,
    );
  }
});

test("showcase exercises at least one tool call", async () => {
  if (loadError) {
    const msg = (loadError as Error)?.message ?? String(loadError);
    assert.fail(`showcase command not loaded: ${msg}`);
  }
  const text = await runShowcaseAndCapture({});
  assert.match(
    text,
    /<tool\s+name=/,
    "expected at least one `<tool name=...>` invocation in the showcase output",
  );
});

test("showcase prints a p2p fallback warning", async () => {
  if (loadError) {
    const msg = (loadError as Error)?.message ?? String(loadError);
    assert.fail(`showcase command not loaded: ${msg}`);
  }
  const text = await runShowcaseAndCapture({});
  // The contract accepts either the exact `[p2p]` prefix or a
  // substring containing both `peer` and `fallback` (case-insensitive).
  const hasExact = /\[p2p\]/.test(text);
  const hasLoose = /peer/.test(text) && /fallback/i.test(text);
  assert.ok(
    hasExact || hasLoose,
    "expected showcase output to include a `[p2p]` line or a `peer`+`fallback` substring",
  );
});
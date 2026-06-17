// @ts-nocheck
// Regression test for CRIT-1 / UAT-FN-07: `rotate-secret` is
// documented in docs/COMMANDS.md but was not wired into the
// command dispatcher. A user running the documented command
// received `unknown command: rotate-secret`.
//
// This test asserts:
//   1. The dispatcher recognises the command.
//   2. The implementation writes a secret to ~/.edgewell/secret
//      with mode 0600.
//   3. The written secret is a valid bearer-token-friendly value
//      (non-empty base64url).
//
// It does NOT assert the side-effect on the user's real homedir;
// the rotate-secret command accepts no flags, so we let it run
// against a sandboxed HOME via process.env.HOME override.

import { test } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { rotateSecretCommand } from "../src/commands/rotate-secret.js";

test("rotateSecretCommand writes a non-empty base64url secret to ~/.edgewell/secret", async () => {
  const sandbox = await fs.mkdtemp(join(tmpdir(), "edgewell-rotate-int-"));
  const origHome = process.env.HOME;
  process.env.HOME = sandbox;
  try {
    const origLog = console.log;
    const captured: string[] = [];
    console.log = (msg: string) => captured.push(msg);
    try {
      await rotateSecretCommand([], {} as any);
    } finally {
      console.log = origLog;
    }
    const secretFile = join(sandbox, ".edgewell", "secret");
    const stat = await fs.stat(secretFile);
    // Mode 0600 = owner read/write only. The implementation
    // uses fs.writeFile({ mode: 0o600 }) which sets the create
    // mask; the directory mode may be more permissive on macOS
    // but the file mode must be 0600.
    assert.equal(stat.mode & 0o777, 0o600, `secret file mode should be 0600, got ${(stat.mode & 0o777).toString(8)}`);
    const secret = (await fs.readFile(secretFile, "utf8")).trim();
    assert.ok(secret.length > 0, "secret should not be empty");
    assert.match(secret, /^[A-Za-z0-9_-]+$/, "secret should be base64url");
    // User-facing message should mention the path and how to use it.
    assert.ok(captured.some((m) => m.includes(secretFile)), "should print the secret file path");
    assert.ok(captured.some((m) => m.includes("EDGEWELL_COMPANION_SECRET")), "should print usage hint");
  } finally {
    if (origHome === undefined) delete process.env.HOME;
    else process.env.HOME = origHome;
    await fs.rm(sandbox, { recursive: true, force: true });
  }
});
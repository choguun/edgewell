// @ts-nocheck
// Unit test for WARN-1 (UAT follow-up): EDGEWELL_DATA_DIR must
// be validated. When run as root, the env var must not resolve
// to a system root. When run as a normal user, the value is
// accepted as-is (the OS will refuse writes to system dirs
// with EACCES, so no need to preempt).

import { test } from "node:test";
import assert from "node:assert/strict";

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_GETUID = process.getuid;
const ORIGINAL_GETEUID = process.geteuid;

function restoreEnv() {
  for (const k of Object.keys(process.env)) delete process.env[k];
  for (const [k, v] of Object.entries(ORIGINAL_ENV)) process.env[k] = v;
  process.getuid = ORIGINAL_GETUID;
  process.geteuid = ORIGINAL_GETEUID;
}

test("EDGEWELL_DATA_DIR=/etc/foo is rejected when running as root", async () => {
  process.env.EDGEWELL_DATA_DIR = "/etc/foo";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (process as any).getuid = () => 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (process as any).geteuid = () => 0;
  // Re-import to pick up the env var.
  const { loadConfig } = await import(`../src/config.js?uid=${Date.now()}`);
  assert.throws(
    () => loadConfig(),
    /EDGEWELL_DATA_DIR.*resolves to.*refusing to write there/,
    "should refuse /etc/foo when running as root",
  );
  delete process.env.EDGEWELL_DATA_DIR;
  restoreEnv();
});

test("EDGEWELL_DATA_DIR=/etc/foo is accepted when running as a normal user", async () => {
  process.env.EDGEWELL_DATA_DIR = "/etc/foo";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (process as any).getuid = () => 501;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (process as any).geteuid = () => 501;
  const { loadConfig } = await import(`../src/config.js?uid=${Date.now()}`);
  const cfg = loadConfig();
  // Resolve to absolute (Node will resolve "/etc/foo" as-is on POSIX).
  assert.match(cfg.data.dir, /\/etc\/foo$/);
  delete process.env.EDGEWELL_DATA_DIR;
  restoreEnv();
});

test("EDGEWELL_DATA_DIR is resolved to an absolute path", async () => {
  process.env.EDGEWELL_DATA_DIR = ".";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (process as any).getuid = () => 501;
  const { loadConfig } = await import(`../src/config.js?uid=${Date.now()}`);
  const cfg = loadConfig();
  // Resolves to the current working directory's absolute path.
  assert.ok(cfg.data.dir.startsWith("/"), `expected absolute path, got ${cfg.data.dir}`);
  delete process.env.EDGEWELL_DATA_DIR;
  restoreEnv();
});

test("after hooks", async () => {
  restoreEnv();
});
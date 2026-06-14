// @ts-nocheck
// Tests that the example v3.0.0 plugins load without errors.

import { test } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { loadPlugins } from "../src/plugins.js";

async function tempDir() {
  return await fs.mkdtemp(join(process.env.TMPDIR ?? "/tmp", "edgewell-plug-"));
}

test("all v3.0.0 example plugins load without throwing", async () => {
  const dir = await tempDir();
  // Provide a no-op tools registry so the v2.0.0 style sleep.plugin.js
  // (which calls ew.tools.register) doesn't crash the test.
  const tools = { register: () => {} };
  const ew = {
    llm: null,
    profile: { load: async () => ({}) },
    journal: { readAll: async () => [] },
    expenses: { readAll: async () => [] },
    rag: { _ensure: async () => {}, chunks: [] },
    tools,
  };
  const out = await loadPlugins("./examples/plugins", ew);
  // Most plugins should load ok. We don't care about a few that
  // depend on real models.
  const ok = out.loaded.filter((l) => l.ok);
  const failed = out.loaded.filter((l) => !l.ok);
  assert.equal(failed.length, 0, `expected every example plugin to load, got ${failed.length} failures: ${failed.map((f) => `${f.name}: ${f.error}`).join(" | ")}`);
  assert.ok(ok.length >= 5, `expected at least 5 plugins to load ok, got ${ok.length}`);
  for (const l of out.loaded) {
    if (!l.ok) {
      console.error(`plugin ${l.name} failed: ${l.error}`);
    }
  }
  await fs.rm(dir, { recursive: true });
});

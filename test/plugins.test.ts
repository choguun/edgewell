// @ts-nocheck
// Tests for the plugin loader (v2.0.0 function-style and v3.0.0
// object-style plugins).

import { test } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadPlugins, listPluginFiles, makePluginContext, runPluginHooks } from "../src/plugins.js";

async function makeTempDir() {
  return await fs.mkdtemp(join(tmpdir(), "edgewell-plugins-"));
}

test("listPluginFiles returns [] for missing dir", async () => {
  const out = await listPluginFiles(join(tmpdir(), "does-not-exist-" + Date.now()));
  assert.deepEqual(out, []);
});

test("listPluginFiles returns only *.plugin.js files", async () => {
  const dir = await makeTempDir();
  await fs.writeFile(join(dir, "a.plugin.js"), "export default {};");
  await fs.writeFile(join(dir, "b.js"), "export default {};");
  await fs.writeFile(join(dir, "c.txt"), "not a plugin");
  const out = await listPluginFiles(dir);
  assert.deepEqual(out.sort(), ["a.plugin.js"]);
  await fs.rm(dir, { recursive: true });
});

test("loadPlugins returns empty result for missing dir", async () => {
  const out = await loadPlugins(join(tmpdir(), "missing-" + Date.now()), { foo: 1 });
  assert.equal(out.loaded.length, 0);
});

test("loadPlugins loads a v2.0.0 function-style plugin", async () => {
  const dir = await makeTempDir();
  await fs.writeFile(
    join(dir, "fn.plugin.js"),
    "export default async function (ew) { ew.touched = true; }",
  );
  const ew = {};
  const out = await loadPlugins(dir, ew);
  await fs.rm(dir, { recursive: true });
  assert.equal(out.loaded.length, 1);
  assert.equal(out.loaded[0].ok, true);
  assert.equal(out.loaded[0].kind, "function");
  assert.equal(ew.touched, true);
});

test("loadPlugins loads a v3.0.0 object-style plugin and runs its hooks", async () => {
  const dir = await makeTempDir();
  await fs.writeFile(
    join(dir, "obj.plugin.js"),
    `export default {
      name: "obj",
      version: "0.1.0",
      hooks: {
        onLoad({ ew }) { ew.loaded = true; },
        registerEmbedder({ register }) { register({ name: "x", dim: 4, embed: () => new Float64Array(4) }); },
        registerAgent({ register }) { register({ name: "x", agent: { name: "x" } }); },
      }
    };`,
  );
  const ew = {};
  const out = await loadPlugins(dir, ew);
  await fs.rm(dir, { recursive: true });
  assert.equal(out.loaded[0].ok, true);
  assert.equal(out.loaded[0].kind, "object");
  assert.equal(ew.loaded, true);
  assert.ok(out.context.embedders.has("x"));
  assert.ok(out.context.agents.has("x"));
});

test("loadPlugins records errors from broken plugins", async () => {
  const dir = await makeTempDir();
  await fs.writeFile(join(dir, "bad.plugin.js"), "throw new Error('nope');");
  const out = await loadPlugins(dir, {});
  await fs.rm(dir, { recursive: true });
  assert.equal(out.loaded.length, 1);
  assert.equal(out.loaded[0].ok, false);
  assert.match(out.loaded[0].error, /nope/);
});

test("makePluginContext returns a fresh context with empty maps", () => {
  const ctx = makePluginContext({ ew: {} });
  assert.equal(ctx.embedders.size, 0);
  assert.equal(ctx.agents.size, 0);
  assert.equal(ctx.routes.length, 0);
});

test("runPluginHooks is a no-op for a plugin without hooks", async () => {
  const ctx = makePluginContext({ ew: {} });
  await runPluginHooks({}, ctx);
  assert.equal(ctx.embedders.size, 0);
});

test("runPluginHooks pushes a registerRoute entry", async () => {
  const ctx = makePluginContext({ ew: {} });
  await runPluginHooks(
    {
      hooks: {
        registerRoute({ register }) {
          register({ method: "GET", pattern: /^\/x$/, handler: () => {} });
        },
      },
    },
    ctx,
  );
  assert.equal(ctx.routes.length, 1);
  assert.equal(ctx.routes[0].method, "GET");
});

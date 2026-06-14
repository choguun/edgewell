// Regression tests for the v3.0.0 E2E sweep. Each test pins
// down one of the bugs we fixed in the sweep so future changes
// can't silently re-introduce them.

import { test } from "node:test";
import assert from "node:assert/strict";
import { promises as fs, readFileSync } from "node:fs";
import path from "node:path";
import { createEdgeWell } from "../src/index.js";
import { goalsCommand } from "../src/commands/goals.js";
import { Orchestrator } from "../src/agents/orchestrator.js";
import { loadPlugins, listPluginFiles } from "../src/plugins.js";
import { renderTemplate, TEMPLATES } from "../src/prompts.js";
import { PKG_VERSION, loadConfig } from "../src/config.js";
import { COMMAND_MAP } from "../src/dispatch.js";
import { profileResetCommand } from "../src/commands/profile-reset.js";

function makeEw(journal = [], expenses = [], extra = {}) {
  return {
    cfg: { version: PKG_VERSION, data: { dir: ".tmp-x" }, rag: { dir: "rag" }, vector: { dim: 128 } },
    journal: { readAll: async () => journal, filePath: null },
    expenses: { readAll: async () => expenses, filePath: null },
    profile: { load: async () => ({ name: "test", language: "en", goals: {} }) },
    rag: { _ensure: async () => {}, chunks: [] },
    ...extra,
  };
}

test("PKG_VERSION matches package.json", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(PKG_VERSION, pkg.version);
});

test("loadConfig injects version from DEFAULTS", () => {
  const cfg = loadConfig();
  assert.equal(cfg.version, PKG_VERSION);
});

test("goals command handles the { health, finance } shape from the schema", async () => {
  const ew = makeEw();
  ew.profile = {
    load: async () => ({
      name: "test",
      goals: {
        health: ["sleep 7+ hours", "drink water"],
        finance: ["save 20%"],
      },
    }),
  };
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await goalsCommand([], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /Health/);
  assert.match(text, /Finance/);
  assert.match(text, /sleep 7\+ hours/);
  assert.match(text, /save 20%/);
});

test("goals command also handles a flat-array profile (backward compat)", async () => {
  const ew = makeEw();
  ew.profile = {
    load: async () => ({ name: "test", goals: ["custom goal one", "custom goal two"] }),
  };
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await goalsCommand([], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /custom goal one/);
  assert.match(text, /custom goal two/);
});

test("goals command prints the empty-hint when no goals are set", async () => {
  const ew = makeEw();
  ew.profile = { load: async () => ({ name: "test" }) };
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await goalsCommand([], ew);
  } finally {
    console.log = orig;
  }
  const text = logs.join("\n");
  assert.match(text, /health: \[\.\.\.\]/);
  assert.match(text, /finance: \[\.\.\.\]/);
});

test("Orchestrator exposes a handle() method for the companion server", async () => {
  const fakeLlm = {
    prompt: async () => '{"agent": "health", "reason": "x"}',
    stream: async function* () {
      yield "ok";
    },
  };
  const fakeHealth = {
    ask: async () => "see a doctor",
    streamAsk: async function* () {
      yield "see a doctor";
    },
  };
  const fakeFinance = {
    ask: async () => "save more",
    streamAsk: async function* () {
      yield "save more";
    },
  };
  const orch = new Orchestrator({ llm: fakeLlm, health: fakeHealth, finance: fakeFinance });
  const out = await orch.handle("I have a headache");
  assert.equal(typeof out, "string");
  assert.match(out, /see a doctor/);
});

test("Orchestrator.handle routes finance questions to the finance agent", async () => {
  const fakeLlm = {
    prompt: async () => '{"agent": "finance", "reason": "money keyword"}',
    stream: async function* () {
      yield "";
    },
  };
  const fakeHealth = { ask: async () => "x", streamAsk: async function* () { yield ""; } };
  const fakeFinance = { ask: async () => "save 20%", streamAsk: async function* () { yield ""; } };
  const orch = new Orchestrator({ llm: fakeLlm, health: fakeHealth, finance: fakeFinance });
  const out = await orch.handle("how can I save more?");
  assert.match(out, /save 20%/);
});

test("loadPlugins returns { loaded, context } shape, not a flat array", async () => {
  const dir = await fs.mkdtemp(path.join(process.env.TMPDIR ?? "/tmp", "edgewell-shape-"));
  const out = await loadPlugins(dir, makeEw());
  assert.ok(Array.isArray(out.loaded), "loaded should be an array");
  assert.ok(out.context, "context should be present");
  assert.ok(out.context.embedders instanceof Map);
  assert.ok(out.context.agents instanceof Map);
  assert.ok(Array.isArray(out.context.routes));
  await fs.rm(dir, { recursive: true });
});

test("TEMPLATES exposes all six agent names so prompt <agent> works", () => {
  for (const name of ["health", "finance", "sleep", "nutrition", "hydration", "activity"]) {
    assert.ok(TEMPLATES[name], `TEMPLATES.${name} should exist`);
  }
  // And the renderer doesn't throw on any of them.
  for (const name of Object.keys(TEMPLATES)) {
    const out = renderTemplate(name, { question: "x", events: [], entries: [] });
    assert.equal(typeof out, "string");
    assert.ok(out.length > 0);
  }
});

test("COMMAND_MAP is exported and contains the highlighted help entries", () => {
  assert.ok(COMMAND_MAP, "COMMAND_MAP should be exported");
  assert.ok(COMMAND_MAP.chat, "chat should be in COMMAND_MAP");
  assert.ok(COMMAND_MAP.goals, "goals should be in COMMAND_MAP");
  assert.ok(COMMAND_MAP.ask, "ask should be in COMMAND_MAP");
  assert.ok(COMMAND_MAP["rag"], "rag should be in COMMAND_MAP");
  // Should be many more than 50.
  const realKeys = Object.keys(COMMAND_MAP).filter((k) => !k.startsWith("-"));
  assert.ok(realKeys.length >= 100, `expected >= 100 real commands, got ${realKeys.length}`);
});

test("config.rag.dir is relative to data.dir (no double-nesting)", () => {
  const cfg = loadConfig();
  assert.equal(cfg.rag.dir, "rag", "rag.dir should be 'rag' (relative to data.dir)");
  assert.ok(!cfg.rag.dir.includes("data/data"), "rag.dir must not contain 'data/data'");
});

test("JsonlStore exposes a filePath property (not _path)", () => {
  // Load the real class to assert the property name.
  return import("../src/store.js").then((mod) => {
    const s = new mod.JsonlStore(".tmp-x");
    assert.equal(typeof s.filePath, "string");
    assert.equal(s._path, undefined, "_path should not exist");
  });
});

test("ProfileStore exposes a filePath property (not _path)", () => {
  return import("../src/profile.js").then((mod) => {
    const p = new mod.ProfileStore(".tmp-profile-x");
    assert.equal(typeof p.filePath, "string");
    assert.equal(p._path, undefined, "_path should not exist");
  });
});

test("profileResetCommand deletes the on-disk profile file", async () => {
  const dir = await fs.mkdtemp(path.join(process.env.TMPDIR ?? "/tmp", "edgewell-prof-"));
  const file = path.join(dir, "profile.json");
  await fs.writeFile(file, JSON.stringify({ name: "x" }));
  const ew = {
    profile: {
      filePath: file,
      save: async (p) => fs.writeFile(file, JSON.stringify(p, null, 2)),
    },
  };
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await profileResetCommand([], ew);
  } finally {
    console.log = orig;
  }
  // File should be gone.
  let exists = true;
  try {
    await fs.access(file);
  } catch {
    exists = false;
  }
  assert.equal(exists, false, "profile file should be deleted");
  await fs.rm(dir, { recursive: true });
});

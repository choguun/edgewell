// Regression tests for the third E2E sweep. Each test pins
// down one of the data-integrity / CLI-behaviour / error-handling
// bugs fixed in this sweep.

import { test } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readPackageJson, projectRoot, PKG_VERSION } from "../src/config.js";
import { readJsonFile } from "../src/jsonl.js";
import { compareCommand } from "../src/commands/compare.js";
import { snapshotMergeCommand } from "../src/commands/snapshot-merge.js";
import { snapshotRedactCommand } from "../src/commands/snapshot-redact.js";
import { profileImportCommand } from "../src/commands/profile-import.js";
import { profileCommand } from "../src/commands/profile.js";
import { seedCommand } from "../src/commands/seed.js";
import { demoDataCommand } from "../src/commands/demo-data.js";
import { weekSummaryCommand } from "../src/commands/week-summary.js";
import { monthSummaryCommand } from "../src/commands/month-summary.js";
import { releaseNotesCommand } from "../src/commands/release-notes.js";
import { watchCommand } from "../src/commands/watch.js";
import { versionBumpCommand } from "../src/commands/version-bump.js";
import { versionCommand } from "../src/commands/version.js";

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

function withExit(fn) {
  const restore = silent();
  let code = 0;
  const origExit = process.exit;
  process.exit = (c) => { code = c; throw new Error("__exit__"); };
  return {
    restore() { process.exit = origExit; restore(); },
    get code() { return code; },
    run: async () => {
      try { await fn(); }
      catch (e) { if (e.message !== "__exit__") throw e; }
    },
  };
}

test("seed includes kind: journal/expense on every record", async () => {
  const restore = silent();
  const jRows = [];
  const eRows = [];
  const ew = {
    journal: { readAll: async () => [], append: async (e) => jRows.push(e) },
    expenses: { readAll: async () => [], append: async (e) => eRows.push(e) },
  };
  await seedCommand(["5"], ew);
  restore();
  for (const r of jRows) {
    assert.equal(r.kind, "journal", `journal record missing kind: ${JSON.stringify(r)}`);
  }
  for (const r of eRows) {
    assert.equal(r.kind, "expense", `expense record missing kind: ${JSON.stringify(r)}`);
  }
});

test("demo-data includes kind: journal/expense on every record", async () => {
  const restore = silent();
  const jRows = [];
  const eRows = [];
  const ew = {
    journal: { readAll: async () => [], append: async (e) => jRows.push(e) },
    expenses: { readAll: async () => [], append: async (e) => eRows.push(e) },
  };
  await demoDataCommand([], ew);
  restore();
  for (const r of jRows) assert.equal(r.kind, "journal");
  for (const r of eRows) assert.equal(r.kind, "expense");
});

test("compare rejects non-JSON input with exit 1", async () => {
  const w = withExit(async () => {
    await compareCommand(["/etc/hosts", "/etc/hosts"]);
  });
  await w.run();
  assert.equal(w.code, 1);
  w.restore();
});

test("snapshot-merge rejects non-JSON input with exit 1", async () => {
  const w = withExit(async () => {
    await snapshotMergeCommand(["/etc/hosts"], {
      journal: { readAll: async () => [], append: async () => {}, filePath: null },
      expenses: { readAll: async () => [], append: async () => {}, filePath: null },
    });
  });
  await w.run();
  assert.equal(w.code, 1);
  w.restore();
});

test("snapshot-redact rejects non-JSON input with exit 1", async () => {
  const w = withExit(async () => {
    await snapshotRedactCommand(["/etc/hosts", "/tmp/x"]);
  });
  await w.run();
  assert.equal(w.code, 1);
  w.restore();
});

test("profile-import rejects non-JSON input with exit 1", async () => {
  const w = withExit(async () => {
    await profileImportCommand(["/etc/hosts"], {
      profile: { save: async () => {} },
    });
  });
  await w.run();
  assert.equal(w.code, 1);
  w.restore();
});

test("readJsonFile rejects a missing file with exit 1", async () => {
  const w = withExit(async () => {
    await readJsonFile("/no/such/file.json", { label: "x" });
  });
  await w.run();
  assert.equal(w.code, 1);
  w.restore();
});

test("readJsonFile rejects malformed JSON with exit 1", async () => {
  const dir = await mkdtemp(join(process.env.TMPDIR ?? "/tmp", "edgewell-rj-"));
  const f = join(dir, "bad.json");
  await writeFile(f, "not json");
  const w = withExit(async () => {
    await readJsonFile(f, { label: "x" });
  });
  await w.run();
  assert.equal(w.code, 1);
  w.restore();
  await fs.rm(dir, { recursive: true, force: true });
});

test("profile set warns on unknown key but still sets it", async () => {
  const restore = silent();
  const logs = [];
  const origErr = console.error;
  console.error = (...a) => logs.push(a.join(" "));
  const saved = [];
  const ew = {
    profile: {
      load: async () => ({ name: "x", language: "en", goals: {}, baseline: {} }),
      save: async (p) => saved.push(p),
    },
  };
  await profileCommand(["set", "nonsense", "x"], ew);
  console.error = origErr;
  restore();
  assert.equal(saved.length, 1);
  assert.equal(saved[0].nonsense, "x");
  assert.ok(logs.some((l) => l.includes("not a known profile key")));
});

test("profile set rejects invalid JSON for goals", async () => {
  const w = withExit(async () => {
    await profileCommand(["set", "goals", "{not json"], {
      profile: { load: async () => ({}), save: async () => {} },
    });
  });
  await w.run();
  assert.equal(w.code, 2);
  w.restore();
});

test("profile set accepts JSON goals object", async () => {
  const restore = silent();
  let saved = null;
  const ew = {
    profile: {
      load: async () => ({ name: "x", language: "en", goals: {}, baseline: {} }),
      save: async (p) => { saved = p; },
    },
  };
  await profileCommand(["set", "goals", '{"health":["a","b"]}'], ew);
  restore();
  assert.deepEqual(saved.goals, { health: ["a", "b"] });
});

test("profile set rejects non-string language", async () => {
  const w = withExit(async () => {
    await profileCommand(["set", "language", "klingon"], {
      profile: { load: async () => ({}), save: async () => {} },
    });
  });
  await w.run();
  assert.equal(w.code, 2);
  w.restore();
});

test("week-summary defaults to the current ISO week", async () => {
  const restore = silent();
  const logs = [];
  const orig = console.log;
  console.log = (...a) => logs.push(a.join(" "));
  const ew = {
    journal: { readAll: async () => [] },
    expenses: { readAll: async () => [] },
  };
  await weekSummaryCommand([], ew);
  console.log = orig;
  restore();
  const out = logs.join("\n");
  // Should mention a YYYY-Www pattern and the current year.
  const year = new Date().getUTCFullYear();
  assert.match(out, new RegExp(`Week summary: ${year}-W\\d{2}`));
});

test("month-summary defaults to the current month", async () => {
  const restore = silent();
  const logs = [];
  const orig = console.log;
  console.log = (...a) => logs.push(a.join(" "));
  const ew = {
    journal: { readAll: async () => [] },
    expenses: { readAll: async () => [] },
  };
  await monthSummaryCommand([], ew);
  console.log = orig;
  restore();
  const out = logs.join("\n");
  const now = new Date();
  const expected = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  assert.match(out, new RegExp(`Month summary: ${expected}`));
});

test("release-notes without args shows the latest recorded release", async () => {
  const restore = silent();
  const logs = [];
  const orig = console.log;
  console.log = (...a) => logs.push(a.join(" "));
  await releaseNotesCommand([]);
  console.log = orig;
  restore();
  const out = logs.join("\n");
  // The CHANGELOG has [2.0.0] as the latest recorded release (3.0.0
  // is still in Unreleased). We just check that the header names a
  // real section.
  assert.match(out, /Release notes: /);
  assert.doesNotMatch(out, /Release notes: Unreleased/);
});

test("release-notes with an explicit version shows that section", async () => {
  const restore = silent();
  const logs = [];
  const orig = console.log;
  console.log = (...a) => logs.push(a.join(" "));
  await releaseNotesCommand(["1.0.0"]);
  console.log = orig;
  restore();
  const out = logs.join("\n");
  assert.match(out, /Release notes: 1\.0\.0/);
  assert.match(out, /2026-01-11/);
});

test("watch exits cleanly on SIGINT", async () => {
  // We can't easily send a real SIGINT in a test, so we test that
  // the handler is registered and that the loop returns promptly
  // once SIGINT fires (rather than looping forever).
  const restore = silent();
  const ew = {
    cfg: { data: { dir: ".tmp-x", journalFile: "j.jsonl", expensesFile: "e.jsonl" } },
    journal: { readAll: async () => [] },
    expenses: { readAll: async () => [] },
  };
  // Use a 100ms interval to keep the test fast.
  const promise = watchCommand(["100"], ew);
  await new Promise((r) => setTimeout(r, 20));
  process.emit("SIGINT");
  // Wait up to 2s for the watch loop to exit.
  const t0 = Date.now();
  await Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("watch did not exit on SIGINT")), 2000))]);
  const elapsed = Date.now() - t0;
  restore();
  assert.ok(elapsed < 1500, `watch took ${elapsed}ms to exit after SIGINT`);
});

test("readPackageJson works from any CWD", () => {
  const pkg = readPackageJson();
  assert.equal(pkg.name, "edgewell");
  assert.equal(pkg.version, PKG_VERSION);
});

test("projectRoot returns an absolute path", () => {
  const root = projectRoot();
  assert.ok(root.startsWith("/"), "projectRoot should be absolute");
  assert.equal(root, join(import.meta.dirname, ".."));
});

test("versionCommand prints the package version", async () => {
  const restore = silent();
  const logs = [];
  const orig = console.log;
  console.log = (...a) => logs.push(a.join(" "));
  await versionCommand();
  console.log = orig;
  restore();
  assert.match(logs.join(""), /edgewell v\d+\.\d+\.\d+/);
});

test("versionBumpCommand rejects unknown kinds with exit 2", async () => {
  const w = withExit(async () => {
    await versionBumpCommand(["nope"]);
  });
  await w.run();
  assert.equal(w.code, 2);
  w.restore();
});

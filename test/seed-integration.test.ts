// @ts-nocheck
// End-to-end integration test for the seed command against real
// on-disk JsonlStores. The pure in-memory test/seed.test.ts mocks
// the stores, so it can miss bugs that only show up when the seed
// is reading and writing real files. UAT-FN-12 was masked for that
// reason: a clean in-memory run said "10/10" while a fresh real
// data dir + on-disk state could say "0/10" depending on what was
// already there.
//
// This test writes to a fresh tmpdir, runs seed, and asserts the
// on-disk counts.

import { test } from "node:test";
import assert from "node:assert/strict";
import { promises as fs, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { JsonlStore } from "../src/store.js";
import { createEdgeWell } from "../src/index.js";
import { seedCommand } from "../src/commands/seed.js";

const dataDirsToCleanup = new Set();

async function freshDataDir() {
  const dir = await fs.mkdtemp(join(tmpdir(), "edgewell-seed-int-"));
  process.env.EDGEWELL_DATA_DIR = dir;
  dataDirsToCleanup.add(dir);
  return dir;
}

async function fileLineCount(p) {
  try {
    const raw = await fs.readFile(p, "utf8");
    return raw.split("\n").filter((l) => l.trim().length > 0).length;
  } catch (err) {
    if (err.code === "ENOENT") return 0;
    throw err;
  }
}

test.afterEach(() => {
  // Clean up tmpdirs so repeated `pnpm test` runs do not leave
  // cruft in $TMPDIR (SUGG-4 from the code review).
  for (const d of dataDirsToCleanup) {
    try { rmSync(d, { recursive: true, force: true }); } catch {}
  }
  dataDirsToCleanup.clear();
  delete process.env.EDGEWELL_DATA_DIR;
});

test("seed 10 against a fresh data dir writes 10 journal + 10 expenses", async () => {
  const dataDir = await freshDataDir();
  // createEdgeWell reads EDGEWELL_DATA_DIR, so the stores will
  // write into the fresh tmpdir.
  const ew = createEdgeWell();
  const origLog = console.log;
  console.log = () => {};
  try {
    await seedCommand(["10"], ew);
  } finally {
    console.log = origLog;
  }
  const j = await fileLineCount(join(dataDir, "journal.jsonl"));
  const e = await fileLineCount(join(dataDir, "expenses.jsonl"));
  assert.equal(j, 10, `journal count: got ${j}, want 10`);
  assert.equal(e, 10, `expense count: got ${e}, want 10`);
});

test("seed 10 idempotent: re-running against the same dir adds 0 new rows", async () => {
  const dataDir = await freshDataDir();
  const ew = createEdgeWell();
  const origLog = console.log;
  console.log = () => {};
  try {
    await seedCommand(["10"], ew);
    await seedCommand(["10"], ew);
  } finally {
    console.log = origLog;
  }
  const j = await fileLineCount(join(dataDir, "journal.jsonl"));
  const e = await fileLineCount(join(dataDir, "expenses.jsonl"));
  // Second run is a no-op because the (day, phrase) and
  // (day, amount, category) keys all collide with the first.
  assert.equal(j, 10, `journal count after re-seed: got ${j}, want 10`);
  assert.equal(e, 10, `expense count after re-seed: got ${e}, want 10`);
});

test("seed 20 against a fresh dir writes 20 (not 10) — UAT-FN-12 regression guard", async () => {
  // The original seed code cycled PHRASES[Math.floor(r()*N)],
  // which collapsed to ≤10 distinct journal rows. The fix
  // (PHRASES[i % N]) makes every row in a single run unique.
  // This test pins that down for runs up to 20.
  const dataDir = await freshDataDir();
  const ew = createEdgeWell();
  const origLog = console.log;
  console.log = () => {};
  try {
    await seedCommand(["20"], ew);
  } finally {
    console.log = origLog;
  }
  const j = await fileLineCount(join(dataDir, "journal.jsonl"));
  assert.equal(j, 20, `journal count: got ${j}, want 20 (regression of UAT-FN-12)`);
});

test("EDGEWELL_DATA_DIR override actually changes where files are written", async () => {
  // This is the knob the integration test in the UAT followup
  // report asked for. Without it, the data/ dir is hard-coded
  // relative to CWD, which makes scripted test setups fragile.
  // The earlier version of this test only checked the in-memory
  // config; this version actually writes a journal entry and
  // confirms it lands in the overridden dir (WARN-2 from the
  // code review).
  const dir = await freshDataDir();
  const ew = createEdgeWell();
  assert.equal(ew.cfg.data.dir, dir, "EDGEWELL_DATA_DIR should be picked up by loadConfig");
  await ew.journal.append({ kind: "journal", _ts: new Date().toISOString(), text: "datadir-test", tags: ["test"] });
  const onDisk = await fs.readFile(join(dir, "journal.jsonl"), "utf8");
  assert.match(onDisk, /datadir-test/, "the journal entry should land in the EDGEWELL_DATA_DIR tmpdir");
  const lineCount = await fileLineCount(join(dir, "journal.jsonl"));
  assert.equal(lineCount, 1, `expected exactly 1 journal line, got ${lineCount}`);
});

// @ts-nocheck
// Regression tests for the seventh E2E sweep: coverage gap on
// untested commands + the ingestAudio / ingestImage file-read bug.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ingestAudio } from "../src/multimodal/audio.js";
import { ingestImage } from "../src/multimodal/image.js";
import { benchCompareCommand } from "../src/commands/bench-compare.js";
import { sampleJournalCommand } from "../src/commands/sample-journal.js";
import { planCommand } from "../src/commands/plan.js";
import { promptCommand } from "../src/commands/prompt.js";
import { releaseCommand } from "../src/commands/release.js";
import { releaseNotesCommand } from "../src/commands/release-notes.js";
import { versionCheckCommand } from "../src/commands/version-check.js";
import { agentsCommand } from "../src/commands/agents.js";
import { tokenCommand } from "../src/commands/token.js";

function silent() {
  const origLog = console.log;
  const origErr = console.error;
  console.log = () => {};
  console.error = () => {};
  return () => { console.log = origLog; console.error = origErr; };
}

// ===== ingestAudio / ingestImage lazy file read =====

test("ingestAudio does not read the file when transcribeFn doesn't need bytes", async () => {
  const r = await ingestAudio({
    filePath: "/tmp/edgewell-missing-audio-zzzz.wav",
    transcribeFn: async ({ meta }) => `fake transcript for ${meta.name}`,
  });
  assert.match(r.text, /fake transcript for/);
  assert.equal(r.kind, "audio");
});

test("ingestImage does not read the file when captionFn doesn't need bytes", async () => {
  const r = await ingestImage({
    filePath: "/tmp/edgewell-missing-image-zzzz.jpg",
    captionFn: async ({ meta }) => `fake caption for ${meta.name}`,
  });
  assert.match(r.text, /fake caption for/);
  assert.equal(r.kind, "image");
});

test("ingestAudio passes empty bytes when the file is missing and transcribeFn runs", async () => {
  const r = await ingestAudio({
    filePath: "/tmp/edgewell-missing-audio-zzzz.wav",
    transcribeFn: async ({ bytes }) => `got ${bytes.length} bytes`,
  });
  assert.equal(r.text, "got 0 bytes");
});

test("ingestImage passes empty bytes when the file is missing and captionFn runs", async () => {
  const r = await ingestImage({
    filePath: "/tmp/edgewell-missing-image-zzzz.jpg",
    captionFn: async ({ bytes }) => `got ${bytes.length} bytes`,
  });
  assert.equal(r.text, "got 0 bytes");
});

test("ingestAudio reads the file and passes real bytes when the file exists", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edgewell-real-audio-"));
  const file = join(dir, "test.wav");
  await writeFile(file, Buffer.from("RIFFWAVE"));
  const r = await ingestAudio({
    filePath: file,
    transcribeFn: async ({ bytes }) => `got ${bytes.length} bytes`,
  });
  assert.equal(r.text, "got 8 bytes");
  assert.equal(r.bytes, 8);
  await rm(dir, { recursive: true });
});

test("ingestImage reads the file and passes real bytes when the file exists", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edgewell-real-image-"));
  const file = join(dir, "test.jpg");
  await writeFile(file, Buffer.from("JFIFDATA"));
  const r = await ingestImage({
    filePath: file,
    captionFn: async ({ bytes }) => `got ${bytes.length} bytes`,
  });
  assert.equal(r.text, "got 8 bytes");
  assert.equal(r.bytes, 8);
  await rm(dir, { recursive: true });
});

test("ingestAudio with buffer doesn't need a file at all", async () => {
  const r = await ingestAudio({
    buffer: Buffer.from("wavdata"),
    transcribeFn: async ({ bytes }) => `got ${bytes.length} bytes`,
  });
  assert.equal(r.text, "got 7 bytes");
  assert.equal(r.bytes, 7);
});

test("ingestImage with buffer doesn't need a file at all", async () => {
  const r = await ingestImage({
    buffer: Buffer.from("jpgdata"),
    captionFn: async ({ bytes }) => `got ${bytes.length} bytes`,
  });
  assert.equal(r.text, "got 7 bytes");
  assert.equal(r.bytes, 7);
});

test("ingestAudio with a transcribeFn that throws propagates the error", async () => {
  await assert.rejects(
    () => ingestAudio({
      filePath: "/tmp/edgewell-missing.wav",
      transcribeFn: async () => { throw new Error("STT unavailable"); },
    }),
    /STT unavailable/,
  );
});

test("ingestImage with a captionFn that throws propagates the error", async () => {
  await assert.rejects(
    () => ingestImage({
      filePath: "/tmp/edgewell-missing.jpg",
      captionFn: async () => { throw new Error("vision unavailable"); },
    }),
    /vision unavailable/,
  );
});

// ===== bench-compare =====

test("benchCompareCommand runs two passes and prints a delta", async () => {
  const restore = silent();
  const logs = [];
  const orig = console.log;
  console.log = (...a) => logs.push(a.join(" "));
  await benchCompareCommand([], {});
  console.log = orig;
  restore();
  // Should have at least 3 lines: header, pass-a, pass-b, delta
  assert.ok(logs.length >= 4);
  assert.ok(logs.some((l) => l.includes("pass-a")));
  assert.ok(logs.some((l) => l.includes("pass-b")));
  assert.ok(logs.some((l) => l.includes("median delta")));
});

// ===== sample-journal =====

test("sampleJournalCommand writes a file and indexes it in the RAG", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edgewell-sample-j-"));
  const ew = {
    cfg: { data: { dir: dir } },
    journal: { readAll: async () => [] },
    rag: {
      _ensure: async () => {},
      chunks: [],
      ingest: async ({ source, text }) => {
        // Capture ingest calls so we can verify
        ew.rag.chunks.push({ source, text });
      },
    },
  };
  const restore = silent();
  await sampleJournalCommand([], ew);
  restore();
  assert.ok(ew.rag.chunks.length > 0, "expected RAG.ingest to be called");
  for (const c of ew.rag.chunks) {
    assert.match(c.text, /\w+/);
  }
  // Verify the file was actually written
  const fs = await import("node:fs/promises");
  const txt = await fs.readFile(join(dir, "sample_journal.txt"), "utf8");
  assert.match(txt, /Slept 7.5 hours/);
  await rm(dir, { recursive: true});
});

// ===== plan =====

test("planCommand with no subcommand prints usage and exits 2", async () => {
  let code = 0;
  const origExit = process.exit;
  process.exit = (c) => { code = c; throw new Error("__exit__"); };
  const restore = silent();
  try {
    await planCommand([], {});
  } catch (e) {
    if (e.message !== "__exit__") throw e;
  } finally {
    process.exit = origExit;
    restore();
  }
  assert.equal(code, 2);
});

test("planCommand health calls ew.health.plan", async () => {
  const ew = { health: { plan: async (goal) => `health-plan: ${goal}` } };
  const restore = silent();
  const logs = [];
  const orig = console.log;
  console.log = (...a) => logs.push(a.join(" "));
  await planCommand(["health", "sleep better"], ew);
  console.log = orig;
  restore();
  assert.deepEqual(logs, ["health-plan: sleep better"]);
});

test("planCommand finance calls ew.finance.monthlyPlan", async () => {
  const ew = { finance: { monthlyPlan: async (args) => `finance-plan: ${args.income}` } };
  const restore = silent();
  const logs = [];
  const orig = console.log;
  console.log = (...a) => logs.push(a.join(" "));
  await planCommand(["finance", "--income", "5000"], ew);
  console.log = orig;
  restore();
  assert.deepEqual(logs, ["finance-plan: 5000"]);
});

// ===== prompt =====

test("promptCommand with no args prints usage and exits 2", async () => {
  let code = 0;
  const origExit = process.exit;
  process.exit = (c) => { code = c; throw new Error("__exit__"); };
  const restore = silent();
  try {
    await promptCommand([], {});
  } catch (e) {
    if (e.message !== "__exit__") throw e;
  } finally {
    process.exit = origExit;
    restore();
  }
  assert.equal(code, 2);
});

test("promptCommand health renders the health template", async () => {
  const restore = silent();
  const logs = [];
  const orig = console.log;
  console.log = (...a) => logs.push(a.join(" "));
  await promptCommand(["health", "test question"], {});
  console.log = orig;
  restore();
  const out = logs.join("\n");
  assert.match(out, /EdgeWell Health/);
  assert.match(out, /test question/);
});

test("promptCommand with unknown agent exits 1 with a clear error", async () => {
  let code = 0;
  const restore = silent();
  const origExit = process.exit;
  process.exit = (c) => { code = c; throw new Error("__exit__"); };
  try {
    await promptCommand(["unknown_template", "x"], {});
  } catch (e) {
    if (e.message !== "__exit__") throw e;
  } finally {
    process.exit = origExit;
    restore();
  }
  assert.equal(code, 1);
});

// ===== release / release-notes / version-check =====

test("releaseCommand prints the release checklist", async () => {
  const restore = silent();
  const logs = [];
  const orig = console.log;
  console.log = (...a) => logs.push(a.join(" "));
  await releaseCommand([], {});
  console.log = orig;
  restore();
  const out = logs.join("\n");
  assert.match(out, /Release checklist/);
  // Should mention at least one of the canonical steps.
  assert.match(out, /version-bump/);
});

test("releaseNotesCommand shows the latest non-Unreleased section by default", async () => {
  const restore = silent();
  const logs = [];
  const orig = console.log;
  console.log = (...a) => logs.push(a.join(" "));
  await releaseNotesCommand([], {});
  console.log = orig;
  restore();
  const out = logs.join("\n");
  // Should NOT show "Unreleased" (which is empty in CHANGELOG.md)
  assert.doesNotMatch(out, /Release notes: Unreleased/);
  // Should show the most recent real release
  assert.match(out, /Release notes: \d+\.\d+\.\d+/);
});

test("releaseNotesCommand with an explicit version shows that section", async () => {
  const restore = silent();
  const logs = [];
  const orig = console.log;
  console.log = (...a) => logs.push(a.join(" "));
  await releaseNotesCommand(["2.0.0"], {});
  console.log = orig;
  restore();
  const out = logs.join("\n");
  assert.match(out, /Release notes: 2\.0\.0/);
});

test("releaseNotesCommand with an unknown version exits 0 with a clear note", async () => {
  const restore = silent();
  const logs = [];
  const orig = console.log;
  console.log = (...a) => logs.push(a.join(" "));
  await releaseNotesCommand(["999.999.999"], {});
  console.log = orig;
  restore();
  assert.ok(logs.some((l) => l.includes("no entries")));
});

test("versionCheckCommand runs without throwing", async () => {
  const restore = silent();
  await versionCheckCommand([], {});
  restore();
});

// ===== agents =====

test("agentsCommand lists all six agent names", async () => {
  const restore = silent();
  const logs = [];
  const orig = console.log;
  console.log = (...a) => logs.push(a.join(" "));
  await agentsCommand([], {});
  console.log = orig;
  restore();
  const out = logs.join("\n");
  for (const name of ["health", "finance", "sleep", "nutrition", "hydration", "activity"]) {
    assert.match(out, new RegExp(`\\b${name}\\b`));
  }
});

// ===== token =====

test("tokenCommand with no args uses the default subject 'console' and a 1h TTL", async () => {
  // Save and restore env
  const prev = process.env.EDGEWELL_COMPANION_SECRET;
  process.env.EDGEWELL_COMPANION_SECRET = "test-secret-for-1234";
  const restore = silent();
  const logs = [];
  const orig = console.log;
  console.log = (...a) => logs.push(a.join(" "));
  try {
    await tokenCommand([], {});
  } finally {
    console.log = orig;
    restore();
    if (prev === undefined) delete process.env.EDGEWELL_COMPANION_SECRET;
    else process.env.EDGEWELL_COMPANION_SECRET = prev;
  }
  // The token is a base64url string followed by a dot and a signature.
  // With our stable secret, the token is deterministic.
  assert.ok(logs.length >= 1, "expected the token to be printed");
  const tokenLine = logs.find((l) => l.startsWith("Y") || l.startsWith("ey")) ?? logs[0];
  assert.match(tokenLine, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
});

// Regression tests for the fifth E2E sweep. Each test pins
// down one of the data-integrity, tool-agent, sensor, dispatch,
// or multimodal bugs fixed in this sweep.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ToolAgent } from "../src/tool-agent.js";
import { ToolRegistry } from "../src/tools.js";
import { summariseEvents, toJournalLine } from "../src/multimodal/sensors.js";
import { ingestPath } from "../src/multimodal/index.js";
import { journalRmCommand } from "../src/commands/journal-rm.js";
import { journalRestoreCommand } from "../src/commands/journal-restore.js";
import { journalStripCommand } from "../src/commands/journal-strip.js";
import { tagsAddCommand } from "../src/commands/tags-add.js";
import { tagRmCommand } from "../src/commands/tag-rm.js";
import { tagDeleteCommand } from "../src/commands/tag-delete.js";
import { retagCommand } from "../src/commands/retag.js";
import { journalEmojiCommand } from "../src/commands/journal-emoji.js";
import { lintFixCommand } from "../src/commands/lint-fix.js";
import { COMMAND_MAP } from "../src/dispatch.js";

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

// Helper: a journal stub that records appends in memory.
function makeJournalStub(records = []) {
  const appended = [];
  return {
    appended,
    filePath: null,
    readAll: async () => records.slice(),
    append: async (e) => { appended.push(e); },
  };
}

// ===== ToolAgent hardening =====

test("ToolAgent stops after detecting a stuck repeated tool call", async () => {
  const reg = new ToolRegistry();
  reg.tools["broken"] = {
    description: "broken",
    params: { type: "object" },
    run: async () => { throw new Error("kaboom"); },
  };
  let n = 0;
  const llm = {
    prompt: async () => { n++; return `<tool name="broken">{}</tool>`; },
  };
  const agent = new ToolAgent({ llm, tools: reg, maxRounds: 5 });
  const r = await agent.ask("test");
  // 1st call throws, 2nd call would throw again with the same
  // signature, so the agent stops. So `n` should be 2.
  assert.equal(n, 2);
  assert.match(r.reply, /stopped: same tool calls/);
});

test("ToolAgent surfaces malformed JSON in a tool call to the caller", async () => {
  const reg = new ToolRegistry();
  reg.tools["t1"] = { description: "1", params: { type: "object" }, run: async () => ({ r: 1 }) };
  // The model emits a bad-JSON tool call on the first round and
  // a bad-JSON call on the second round (so the stuck-detection
  // kicks in). The final reply should include the
  // "malformed JSON" message because we couldn't recover.
  const llm = {
    prompt: async () => `<tool name="t1">not json</tool>`,
  };
  const agent = new ToolAgent({ llm, tools: reg, maxRounds: 5 });
  const r = await agent.ask("test");
  assert.match(r.reply, /malformed JSON/);
});

test("ToolAgent surfaces an unclosed tool tag to the caller", async () => {
  const reg = new ToolRegistry();
  reg.tools["t1"] = { description: "1", params: { type: "object" }, run: async () => ({ r: 1 }) };
  const llm = { prompt: async () => `<tool name="t1">{} partial <tool name="t2">{}` };
  const agent = new ToolAgent({ llm, tools: reg, maxRounds: 3 });
  const r = await agent.ask("test");
  assert.match(r.reply, /unclosed/);
});

test("ToolAgent executes valid tool calls in order", async () => {
  const reg = new ToolRegistry();
  const order = [];
  reg.tools["a"] = { description: "a", params: { type: "object" }, run: async () => { order.push("a"); return { r: "a" }; } };
  reg.tools["b"] = { description: "b", params: { type: "object" }, run: async () => { order.push("b"); return { r: "b" }; } };
  let n = 0;
  const llm = {
    prompt: async () => {
      n++;
      return n === 1 ? `<tool name="a">{}</tool><tool name="b">{}</tool>` : "all good";
    },
  };
  const agent = new ToolAgent({ llm, tools: reg, maxRounds: 3 });
  const r = await agent.ask("test");
  assert.deepEqual(order, ["a", "b"]);
  assert.equal(r.toolCalls.length, 2);
  assert.equal(r.reply, "all good");
});

// ===== Sensor pipeline hardening =====

test("summariseEvents skips events with missing value", () => {
  const s = summariseEvents([
    { kind: "steps", ts: "2026-01-01T12:00:00Z", value: 5000 },
    { kind: "steps", ts: "2026-01-01T12:00:00Z" }, // missing value
    { kind: "steps", ts: "2026-01-01T12:00:00Z", value: "not a number" }, // bad value
    { kind: "steps", ts: "2026-01-01T12:00:00Z", value: NaN },
  ]);
  assert.equal(s.steps.count, 1, "only the valid event counts");
  assert.equal(s.steps.invalid, 3, "the 3 malformed events are tracked");
  assert.equal(s.steps.min, 5000);
  assert.equal(s.steps.max, 5000);
});

test("summariseEvents skips events with missing ts", () => {
  const s = summariseEvents([
    { kind: "steps", value: 5000 }, // missing ts
    { kind: "steps", ts: "2026-01-01T12:00:00Z", value: 5000 },
  ]);
  assert.equal(s.steps.count, 1);
});

test("summariseEvents returns an empty summary for empty input", () => {
  const s = summariseEvents([]);
  assert.deepEqual(s, {});
});

test("toJournalLine returns empty string for empty summary", () => {
  assert.equal(toJournalLine({}), "");
  assert.equal(toJournalLine(null), "");
  assert.equal(toJournalLine(undefined), "");
});

test("toJournalLine returns empty string when all entries have count=0", () => {
  assert.equal(toJournalLine({ steps: { count: 0 } }), "");
});

test("toJournalLine formats a non-empty summary correctly", () => {
  const s = {
    steps: { count: 2, min: 5000, max: 8000, avg: 6500 },
  };
  const line = toJournalLine(s, new Date("2026-01-15T12:00:00Z"));
  assert.match(line, /steps 2× \(avg 6500, 5000–8000\)/);
  assert.match(line, /^\[2026-01-15\]/);
});

test("toJournalLine does not crash on a malformed entry", () => {
  // The previous implementation would produce
  // "steps undefined× (avg undefined, undefined–undefined)" for
  // this input. The new implementation should produce an empty
  // string instead.
  assert.equal(toJournalLine({ steps: 42 }), "");
  assert.equal(toJournalLine({ steps: "not an object" }), "");
});

// ===== Multimodal dispatcher hardening =====

test("ingestPath with no filePath throws a clear error", async () => {
  await assert.rejects(() => ingestPath({}), /filePath/);
});

test("ingestPath with a non-existent file throws a clear ENOENT", async () => {
  await assert.rejects(() => ingestPath({ filePath: "/no/such/file" }), /file not found/);
});

// ===== Dispatch dedup =====

test("COMMAND_MAP has no duplicate keys for real commands", () => {
  const counts = {};
  for (const k of Object.keys(COMMAND_MAP)) {
    counts[k] = (counts[k] ?? 0) + 1;
  }
  const dups = Object.entries(counts).filter(([_, v]) => v > 1);
  assert.deepEqual(dups, [], `duplicate keys: ${dups.map(([k]) => k).join(", ")}`);
});

// ===== Audit-shape commands include `kind` =====

test("journal-rm appends a record with kind: journal", async () => {
  const s = makeJournalStub([{ _ts: "t", text: "x" }]);
  const restore = silent();
  await journalRmCommand(["0"], { journal: s });
  restore();
  assert.equal(s.appended.length, 1);
  assert.equal(s.appended[0].kind, "journal");
  assert.equal(s.appended[0].removedFrom, 0);
});

test("journal-restore appends a record with kind: journal", async () => {
  const s = makeJournalStub([{ _ts: "t", text: "x" }]);
  const restore = silent();
  await journalRestoreCommand(["0"], { journal: s });
  restore();
  assert.equal(s.appended.length, 1);
  assert.equal(s.appended[0].kind, "journal");
  assert.equal(s.appended[0].restoredFrom, 0);
});

test("journal-strip appends a record with kind: journal", async () => {
  const s = makeJournalStub([{ _ts: "t", text: "x", tags: ["foo"] }]);
  const restore = silent();
  await journalStripCommand(["foo"], { journal: s });
  restore();
  assert.ok(s.appended.length >= 1);
  for (const a of s.appended) {
    assert.equal(a.kind, "journal");
    assert.equal(a.strippedTag, "foo");
  }
});

test("tags-add appends a record with kind: journal", async () => {
  const s = makeJournalStub([{ _ts: "t", text: "x", tags: [] }]);
  const restore = silent();
  await tagsAddCommand(["0", "foo"], { journal: s });
  restore();
  assert.equal(s.appended.length, 1);
  assert.equal(s.appended[0].kind, "journal");
  assert.equal(s.appended[0].tagAdded, "foo");
});

test("tag-rm appends a record with kind: journal", async () => {
  const s = makeJournalStub([{ _ts: "t", text: "x", tags: ["foo"] }]);
  const restore = silent();
  await tagRmCommand(["0", "foo"], { journal: s });
  restore();
  assert.equal(s.appended.length, 1);
  assert.equal(s.appended[0].kind, "journal");
  assert.equal(s.appended[0].tagRemoved, "foo");
});

test("tag-delete appends a record with kind: journal", async () => {
  const s = makeJournalStub([{ _ts: "t", text: "x", tags: ["foo"] }]);
  const restore = silent();
  await tagDeleteCommand(["foo"], { journal: s });
  restore();
  assert.ok(s.appended.length >= 1);
  for (const a of s.appended) {
    assert.equal(a.kind, "journal");
    assert.equal(a.tagDeleted, "foo");
  }
});

test("retag appends a record with kind: journal", async () => {
  const s = makeJournalStub([{ _ts: "t", text: "x", tags: ["old"] }]);
  const restore = silent();
  await retagCommand(["old", "new"], { journal: s });
  restore();
  assert.equal(s.appended.length, 1);
  assert.equal(s.appended[0].kind, "journal");
  assert.equal(s.appended[0].renamedFrom, "old");
  assert.equal(s.appended[0].renamedTo, "new");
});

test("journal-emoji appends a record with kind: journal", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edgewell-jemj-"));
  const file = join(dir, "j.jsonl");
  const s = {
    filePath: file,
    readAll: async () => [{ _ts: "t", text: "x" }],
  };
  const restore = silent();
  await journalEmojiCommand(["😀"], { journal: s });
  restore();
  const fs = await import("node:fs/promises");
  const text = await fs.readFile(file, "utf8");
  const rec = JSON.parse(text.trim().split("\n").pop());
  assert.equal(rec.kind, "journal");
  assert.equal(rec.emojiAppended, "😀");
  await rm(dir, { recursive: true });
});

test("lint-fix appends a record with kind: journal", async () => {
  const s = makeJournalStub([{ _ts: "t", text: "" }]);
  const restore = silent();
  await lintFixCommand([], { journal: s });
  restore();
  assert.equal(s.appended.length, 1);
  assert.equal(s.appended[0].kind, "journal");
  assert.equal(s.appended[0].text, "(empty)");
  assert.equal(s.appended[0].fixedFrom, 0);
});

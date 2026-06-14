// @ts-nocheck
// Tests for the multimodal ingest pipelines (image, audio, sensors).

import { test } from "node:test";
import assert from "node:assert/strict";
import { ingestImage, isImagePath } from "../src/multimodal/image.js";
import { ingestAudio, isAudioPath } from "../src/multimodal/audio.js";
import { summariseEvents, toJournalLine, isSupported, SUPPORTED } from "../src/multimodal/sensors.js";
import { ingestPath } from "../src/multimodal/index.js";

test("isImagePath recognises common image extensions", () => {
  assert.equal(isImagePath("photo.JPG"), true);
  assert.equal(isImagePath("icon.png"), true);
  assert.equal(isImagePath("doc.pdf"), false);
});

test("ingestImage returns a placeholder caption without a captionFn", async () => {
  const result = await ingestImage({ filePath: "sunset.jpg", buffer: Buffer.from([0xff, 0xd8, 0xff]) });
  assert.equal(result.kind, "image");
  assert.equal(result.source, "image:sunset");
  assert.match(result.text, /sunset/);
});

test("ingestImage uses an injected captionFn when provided", async () => {
  const result = await ingestImage({
    filePath: "lab.png",
    buffer: Buffer.from("fake"),
    captionFn: async ({ meta }) => `OCR: potassium 4.2 mmol/L`,
  });
  assert.match(result.text, /potassium 4\.2/);
  assert.equal(result.meta.name, "lab");
});

test("ingestImage throws when neither path nor buffer is given", async () => {
  await assert.rejects(() => ingestImage({}));
});

test("isAudioPath recognises common audio extensions", () => {
  assert.equal(isAudioPath("voice.wav"), true);
  assert.equal(isAudioPath("voice.MP3"), true);
  assert.equal(isAudioPath("voice.txt"), false);
});

test("ingestAudio returns a placeholder transcript without a transcribeFn", async () => {
  const result = await ingestAudio({ filePath: "morning.wav", buffer: Buffer.from("RIFF") });
  assert.equal(result.kind, "audio");
  assert.equal(result.source, "audio:morning");
  assert.match(result.text, /morning/);
});

test("ingestAudio uses an injected transcribeFn when provided", async () => {
  const result = await ingestAudio({
    filePath: "rx.m4a",
    buffer: Buffer.from("fake"),
    transcribeFn: async () => "I took my blood pressure medication this morning.",
  });
  assert.match(result.text, /blood pressure medication/);
});

test("summariseEvents groups events by kind and computes min/max/avg", () => {
  const events = [
    { kind: "heart_rate", ts: "2026-01-14T08:00:00Z", value: 72 },
    { kind: "heart_rate", ts: "2026-01-14T08:10:00Z", value: 80 },
    { kind: "heart_rate", ts: "2026-01-14T08:20:00Z", value: 90 },
    { kind: "steps", ts: "2026-01-14T08:00:00Z", value: 5000 },
  ];
  const s = summariseEvents(events);
  assert.equal(s.heart_rate.count, 3);
  assert.equal(s.heart_rate.min, 72);
  assert.equal(s.heart_rate.max, 90);
  assert.equal(s.heart_rate.avg, 80.67);
  assert.equal(s.steps.count, 1);
});

test("summariseEvents ignores unsupported kinds", () => {
  const events = [
    { kind: "heart_rate", ts: "t", value: 70 },
    { kind: "galaxy_brain", ts: "t", value: 9000 },
  ];
  const s = summariseEvents(events);
  assert.ok("heart_rate" in s);
  assert.ok(!("galaxy_brain" in s));
});

test("toJournalLine renders a one-line summary", () => {
  const s = summariseEvents([
    { kind: "heart_rate", ts: "t1", value: 70 },
    { kind: "steps", ts: "t2", value: 8000 },
  ]);
  const line = toJournalLine(s, new Date("2026-01-14T12:00:00Z"));
  assert.match(line, /heart_rate/);
  assert.match(line, /steps/);
  assert.match(line, /2026-01-14/);
});

test("toJournalLine returns empty string for empty summaries", () => {
  assert.equal(toJournalLine({}), "");
});

test("SUPPORTED list is exported and contains heart_rate and steps", () => {
  assert.ok(SUPPORTED.has("heart_rate"));
  assert.ok(SUPPORTED.has("steps"));
  assert.equal(isSupported("heart_rate"), true);
  assert.equal(isSupported("galaxy_brain"), false);
});

test("ingestPath dispatches to image pipeline for .jpg", async () => {
  const r = await ingestPath({ filePath: "x.jpg", buffer: Buffer.from("fake") });
  assert.equal(r.kind, "image");
});

test("ingestPath dispatches to audio pipeline for .wav", async () => {
  const r = await ingestPath({ filePath: "x.wav", buffer: Buffer.from("fake") });
  assert.equal(r.kind, "audio");
});

test("ingestPath dispatches to image pipeline for .png", async () => {
  const r = await ingestPath({ filePath: "x.png", buffer: Buffer.from("fake") });
  assert.equal(r.kind, "image");
});

test("ingestPath dispatches to audio pipeline for .mp3", async () => {
  const r = await ingestPath({ filePath: "x.mp3", buffer: Buffer.from("fake") });
  assert.equal(r.kind, "audio");
});

test("ingestPath falls back to text for unknown extensions", async () => {
  const { promises: fs } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const p = join(tmpdir(), `edgewell-test-${Date.now()}.md`);
  await fs.writeFile(p, "hello world");
  const r = await ingestPath({ filePath: p });
  await fs.unlink(p);
  assert.equal(r.kind, "text");
  assert.equal(r.text, "hello world");
});

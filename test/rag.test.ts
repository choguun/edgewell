// @ts-nocheck
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { promises as fs } from "node:fs";
import { RagIndex } from "../src/rag.js";

test("RagIndex chunks, indexes, and searches", async () => {
  const dir = `.tmp-rag-${Date.now()}`;
  const r = new RagIndex({ dir, chunkSize: 200, chunkOverlap: 20, topK: 3 });
  const text =
    "Sleeping seven hours improves mood and energy. " +
    "Drinking two liters of water daily supports kidney function. " +
    "Walking eight thousand steps per day lowers cardiovascular risk.";
  const n = await r.ingest({ source: "notes", text });
  assert.ok(n >= 1, "should produce at least one chunk");
  const hits = await r.search("how much water should I drink");
  assert.ok(hits.length >= 1, "should find water chunk");
  assert.match(hits[0].text, /water/i);
  const block = await r.contextBlock("sleep and mood");
  assert.ok(block.length > 0);
  await fs.rm(dir, { recursive: true, force: true });
});

test("RagIndex persists across instances", async () => {
  const dir = `.tmp-rag-persist-${Date.now()}`;
  const r1 = new RagIndex({ dir });
  await r1.ingest({ source: "a", text: "pineapple belongs on pizza sometimes" });
  const r2 = new RagIndex({ dir });
  const hits = await r2.search("pineapple pizza");
  assert.equal(hits.length, 1);
  await fs.rm(dir, { recursive: true, force: true });
});

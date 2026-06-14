// @ts-nocheck
import { test } from "node:test";
import assert from "node:assert/strict";
import { describeModel, listModels, pickModel } from "../src/registry.js";

test("describeModel returns metadata for known ids", () => {
  const m = describeModel("LLAMA_3_1_8B_INST_Q4_K_M");
  assert.equal(m.family, "llama");
  assert.equal(m.tier, "medium");
});

test("describeModel returns a placeholder for unknown ids", () => {
  const m = describeModel("CUSTOM_MODEL_42");
  assert.equal(m.family, "unknown");
});

test("listModels contains medpsy entries", () => {
  const all = listModels();
  const medpsy = all.find((m) => m.family === "medpsy");
  assert.ok(medpsy, "expected at least one medpsy model");
  assert.equal(medpsy.domain, "medical");
});

test("pickModel filters by tier and ram", () => {
  const picks = pickModel({ tier: "small", maxRamGb: 3 });
  assert.ok(picks.length >= 1);
  for (const m of picks) {
    assert.equal(m.tier, "small");
    assert.ok(m.ramGb <= 3);
  }
});

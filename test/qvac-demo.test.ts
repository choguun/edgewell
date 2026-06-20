// @ts-nocheck
// Tests for the v3.0.2 demo-mode detection on EdgeWellLLM.
//
// The local vendor stub at vendor/qvac-sdk/index.mjs uses a
// `stub-model:<name>` modelId convention. The `isDemo()` method
// on EdgeWellLLM checks for that prefix so the companion's
// /health can tell the web UI to render the demo banner.

import { test } from "node:test";
import assert from "node:assert/strict";
import { EdgeWellLLM } from "../src/qvac.js";

test("isDemo() returns true when the modelId is a stub-model", () => {
  const llm = new EdgeWellLLM({ model: "LLAMA_3_1_8B_INST_Q4_K_M" });
  llm.modelId = "stub-model:LLAMA_3_1_8B_INST_Q4_K_M";
  assert.equal(llm.isDemo(), true);
});

test("isDemo() returns false when the modelId is a real loaded model", () => {
  const llm = new EdgeWellLLM({ model: "LLAMA_3_1_8B_INST_Q4_K_M" });
  llm.modelId = "real-model-xyz-123";
  assert.equal(llm.isDemo(), false);
});

test("isDemo() returns false when the model has not been loaded yet", () => {
  const llm = new EdgeWellLLM({ model: "LLAMA_3_1_8B_INST_Q4_K_M" });
  // modelId is null by default
  assert.equal(llm.modelId, null);
  // isDemo() should be falsy (we don't want to claim demo
  // mode just because the model hasn't loaded yet — only
  // when we know we're on the stub).
  assert.equal(llm.isDemo(), false);
});

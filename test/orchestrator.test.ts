// @ts-nocheck
import { test } from "node:test";
import assert from "node:assert/strict";
import { Orchestrator } from "../src/agents/orchestrator.js";

function fakeLlm(reply) {
  return {
    load: async () => 1,
    unload: async () => {},
    prompt: async () => reply,
    stream: async function* () {
      yield reply;
    },
  };
}

test("Orchestrator routes to health for symptom questions", async () => {
  const o = new Orchestrator({
    llm: fakeLlm('{"agent":"health","reason":"symptom"}'),
    health: { ask: async () => "see a doctor" },
    finance: { ask: async () => "save more" },
  });
  const out = await o.ask("I have a headache");
  assert.equal(out.agent, "health");
  assert.equal(out.reply, "see a doctor");
});

test("Orchestrator falls back to keyword routing on bad JSON", async () => {
  const o = new Orchestrator({
    llm: fakeLlm("not json"),
    health: { ask: async () => "h" },
    finance: { ask: async () => "f" },
  });
  const out = await o.ask("I want to track my budget for next month");
  assert.equal(out.agent, "finance");
  assert.equal(out.reply, "f");
});

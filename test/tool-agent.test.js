import { test } from "node:test";
import assert from "node:assert/strict";
import { ToolAgent } from "../src/tool-agent.js";
import { ToolRegistry } from "../src/tools.js";

function fakeLlm(responses) {
  let i = 0;
  return {
    prompt: async () => responses[i++ % responses.length],
    stream: async function* () { yield ""; },
  };
}

test("ToolAgent returns reply when model emits no tool calls", async () => {
  const llm = fakeLlm(["just an answer"]);
  const agent = new ToolAgent({ llm });
  const { reply, toolCalls } = await agent.ask("hello");
  assert.equal(reply, "just an answer");
  assert.equal(toolCalls.length, 0);
});

test("ToolAgent extracts and executes a single tool call", async () => {
  const llm = fakeLlm([
    'I will compute.\n<tool name="calculator">{"expression":"2+2"}</tool>',
    "the result is 4",
  ]);
  const agent = new ToolAgent({ llm, tools: new ToolRegistry() });
  const { reply, toolCalls } = await agent.ask("what is 2+2?");
  assert.equal(toolCalls.length, 1);
  assert.equal(toolCalls[0].name, "calculator");
  assert.equal(reply, "the result is 4");
});

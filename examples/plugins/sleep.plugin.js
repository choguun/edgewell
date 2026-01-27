// Example EdgeWell plugin: a sleep-tracking agent and tool.
//
// To enable, run EdgeWell with:
//   EDGEWELL_PLUGINS=./examples/plugins node bin/edgewell.js status
// or copy this file into a directory you pass via loadPlugins().

import { ToolRegistry } from "../../src/tools.js";

const SYSTEM = `You are EdgeWell Sleep, a private on-device sleep coach.
You help the user track and improve their sleep. Be concise and
supportive. Always close with: "Note: not a medical device."`;

async function sleepCoachAgent(llm, rag, profile) {
  return {
    name: "sleep",
    system: SYSTEM,
    async ask(question, history = []) {
      return llm.prompt({ system: SYSTEM, user: question, history, maxTokens: 400 });
    },
    async *streamAsk(question, history = []) {
      for await (const tok of llm.stream({ system: SYSTEM, user: question, history, maxTokens: 400 })) {
        yield tok;
      }
    },
  };
}

export default async function register(ew) {
  // Register a custom tool.
  ew.tools.register("log_sleep", {
    description: "Log a single night's sleep. Params: { hours, quality (1-5), note? }",
    params: {
      type: "object",
      required: ["hours", "quality"],
      properties: {
        hours: { type: "number", minimum: 0, maximum: 24 },
        quality: { type: "integer", minimum: 1, maximum: 5 },
        note: { type: "string", maxLength: 500 },
      },
    },
    async run({ hours, quality, note }, ctx) {
      const store = ctx?.journal;
      if (!store) throw new Error("journal store not configured");
      await store.append({
        kind: "journal",
        text: `slept ${hours}h, quality ${quality}/5${note ? ` (${note})` : ""}`,
        tags: ["sleep"],
      });
      return { ok: true };
    },
  });

  // Register a custom agent that the orchestrator can route to.
  ew.customAgents = ew.customAgents ?? {};
  ew.customAgents.sleep = await sleepCoachAgent(ew.llm, ew.rag, ew.profile);

  ew.log?.info?.("sleep plugin registered");
}

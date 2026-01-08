// Test helper: build a fully wired EdgeWell instance with a fake LLM.
// No QVAC SDK required for unit tests.

import { createEdgeWell } from "../src/index.js";

export function fakeLlmStream(tokens) {
  return (async function* () {
    for (const t of tokens) yield t;
  })();
}

export function makeFakeEdgeWell({ tokens, route, prompt } = {}) {
  // Use a temp data dir so tests don't touch real user data.
  const dir = `.tmp-edgewell-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ew = createEdgeWell({ data: { dir } });

  // Replace the underlying LLM with a tiny stub.
  const stub = {
    load: async () => 1,
    unload: async () => {},
    prompt: async (body) => prompt?.(body) ?? `echo: ${body.user}`,
    stream: async function* (body) {
      if (tokens) {
        for (const t of tokens) yield t;
        return;
      }
      yield `echo: ${body.user}`;
    },
  };
  ew.llm = stub;
  ew.health.llm = stub;
  ew.finance.llm = stub;
  ew.orchestrator.llm = stub;
  if (route) ew.orchestrator.route = route;
  return { ew, dir, stub };
}

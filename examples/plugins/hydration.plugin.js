// Example plugin: hydration. Demonstrates the v3.0.0
// `registerAgent` hook by exposing a custom agent to the
// orchestrator. The agent is a thin wrapper over the existing
// HydrationAgent in src/agents/hydration.js.

import { HydrationAgent } from "../../src/agents/hydration.js";

export default {
  name: "hydration-example",
  version: "0.1.0",
  hooks: {
    registerAgent({ register, ew }) {
      const agent = new HydrationAgent({ llm: ew.llm });
      register({ name: "hydration", agent });
    },
    onLoad({ log }) {
      log.info("hydration-example plugin loaded");
    },
  },
};

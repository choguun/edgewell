// Example plugin: health-v3. Demonstrates the v3.0.0
// `registerAgent` hook by wrapping the existing HealthAgent
// (added in v2.0.0) and exposing it under the name "health".

import { HealthAgent } from "../../src/agents/health.js";

export default {
  name: "health-v3-example",
  version: "0.1.0",
  hooks: {
    registerAgent({ register, ew }) {
      const agent = new HealthAgent({ llm: ew.llm, rag: ew.rag, profile: ew.profile });
      register({ name: "health", agent });
    },
    onLoad({ log }) {
      log.info("health-v3-example plugin loaded");
    },
  },
};

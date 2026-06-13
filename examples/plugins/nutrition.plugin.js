// Example plugin: nutrition. Demonstrates the v3.0.0
// `registerAgent` hook by exposing a custom agent to the
// orchestrator. The agent is a thin wrapper over the existing
// NutritionAgent in src/agents/nutrition.js.

import { NutritionAgent } from "../../src/agents/nutrition.js";

export default {
  name: "nutrition-example",
  version: "0.1.0",
  hooks: {
    registerAgent({ register, ew }) {
      const agent = new NutritionAgent({ llm: ew.llm });
      register({ name: "nutrition", agent });
    },
    onLoad({ log }) {
      log.info("nutrition-example plugin loaded");
    },
  },
};

// Example plugin: activity. Demonstrates the v3.0.0
// `registerAgent` hook by wrapping the ActivityAgent from
// src/agents/activity.js.

import { ActivityAgent } from "../../src/agents/activity.js";

export default {
  name: "activity-example",
  version: "0.1.0",
  hooks: {
    registerAgent({ register, ew }) {
      const agent = new ActivityAgent({ llm: ew.llm });
      register({ name: "activity", agent });
    },
    onLoad({ log }) {
      log.info("activity-example plugin loaded");
    },
  },
};

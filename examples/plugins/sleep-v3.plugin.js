// Example plugin: sleep (v3.0.0 style). Demonstrates the new
// `registerAgent` hook by wrapping the SleepAgent from
// src/agents/sleep.js. The v2.0.0 style plugin is kept in
// sleep.plugin.js for backwards compatibility.

import { SleepAgent } from "../../src/agents/sleep.js";

export default {
  name: "sleep-v3-example",
  version: "0.1.0",
  hooks: {
    registerAgent({ register, ew }) {
      const agent = new SleepAgent({ llm: ew.llm });
      register({ name: "sleep", agent });
    },
    onLoad({ log }) {
      log.info("sleep-v3-example plugin loaded");
    },
  },
};

// Example plugin: finance-v3. Demonstrates the v3.0.0
// `registerAgent` hook by wrapping the existing FinanceAgent
// (added in v2.0.0) and exposing it under the name "finance".

import { FinanceAgent } from "../../src/agents/finance.js";

export default {
  name: "finance-v3-example",
  version: "0.1.0",
  hooks: {
    registerAgent({ register, ew }) {
      const agent = new FinanceAgent({ llm: ew.llm, expenses: ew.expenses });
      register({ name: "finance", agent });
    },
    onLoad({ log }) {
      log.info("finance-v3-example plugin loaded");
    },
  },
};

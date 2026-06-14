// @ts-nocheck
// `edgewell bench` runs a short prompt through the configured LLM
// three times and reports token throughput. Useful for capacity
// planning on a new device.

import { c, header } from "../cli.js";

const PROMPT = "Briefly describe what a healthy morning routine looks like.";

export async function benchCommand(_args, ew) {
  header("EdgeWell benchmark");
  const llm = ew.llm;
  const trials = 3;
  const results = [];
  for (let i = 0; i < trials; i++) {
    const t0 = Date.now();
    let tokens = 0;
    try {
      for await (const tok of llm.stream({ user: PROMPT, maxTokens: 200 })) {
        tokens++;
      }
    } catch (err) {
      console.log(c.red(`trial ${i + 1} failed: ${err.message}`));
      continue;
    }
    const ms = Date.now() - t0;
    results.push({ trial: i + 1, ms, tokens });
    console.log(c.dim(`trial ${i + 1}: ${tokens} tokens in ${ms}ms`));
  }
  if (results.length === 0) {
    console.log(c.yellow("no trials succeeded"));
    return;
  }
  const totalTokens = results.reduce((a, b) => a + b.tokens, 0);
  const totalMs = results.reduce((a, b) => a + b.ms, 0);
  console.log(`${c.bold("avg throughput:")} ${(totalTokens / (totalMs / 1000)).toFixed(1)} tok/s`);
}

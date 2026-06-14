// @ts-nocheck
// ToolAgent wraps a normal agent and adds a tool-calling loop:
// 1. Build a system prompt that lists available tools.
// 2. Ask the model.
// 3. If the model emits one or more <tool name="..."> {json} </tool>
//    blocks, execute them and feed the results back as a follow-up
//    message. Otherwise return the raw reply.
//
// v3.0.1 hardening: detect repeated identical tool calls and stop
// early so a misbehaving model doesn't burn `maxRounds` calling
// the same broken tool. Also: a malformed <tool> tag (unclosed or
// bad JSON) is no longer silently dropped — it produces a clear
// result so the model can self-correct.

import { ToolRegistry } from "./tools.js";

const TOOL_TAG = /<tool\s+name="([a-zA-Z0-9_-]+)"\s*>([\s\S]*?)<\/tool>/g;

function extractToolCalls(text) {
  const calls = [];
  const bad = [];
  let m;
  TOOL_TAG.lastIndex = 0;
  while ((m = TOOL_TAG.exec(text)) !== null) {
    const name = m[1];
    const raw = m[2].trim();
    let params = {};
    if (raw) {
      try {
        params = JSON.parse(raw);
      } catch (err) {
        // Don't silently coerce bad JSON to a magic `expression`
        // key — record it as a malformed call so the loop can
        // surface the error to the model.
        bad.push({ name, error: `malformed JSON in tool call: ${err.message}`, raw });
        continue;
      }
    }
    calls.push({ name, params });
  }
  return { calls, bad };
}

function stableStringify(x) {
  if (x === null || typeof x !== "object") return JSON.stringify(x);
  if (Array.isArray(x)) return "[" + x.map(stableStringify).join(",") + "]";
  const keys = Object.keys(x).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + stableStringify(x[k])).join(",") + "}";
}

export class ToolAgent {
  constructor({ llm, tools = new ToolRegistry(), ctx = {}, maxRounds = 3, baseSystem = "" } = {}) {
    this.llm = llm;
    this.tools = tools;
    this.ctx = ctx;
    this.maxRounds = maxRounds;
    this.baseSystem = baseSystem;
  }

  _systemPrompt() {
    const toolBlock = this.tools.describeForPrompt();
    return `${this.baseSystem}\n\nAvailable tools (call by emitting <tool name="...">{json params}</tool>):\n${toolBlock}\n\nIf you do not need a tool, answer directly without any tool tags.`;
  }

  async ask(question, history = []) {
    let messages = history.slice();
    let last = question;
    let lastReply = "";
    const allCalls = [];
    // Hash of the last round's resolved tool calls. If the same
    // exact call set comes back unchanged, stop early so we don't
    // burn the whole budget on a model that's stuck.
    let lastSignature = "";
    for (let i = 0; i < this.maxRounds; i++) {
      const reply = await this.llm.prompt({
        system: this._systemPrompt(),
        history: messages,
        user: last,
        maxTokens: 600,
      });
      lastReply = reply;
      const { calls, bad } = extractToolCalls(reply);
      // Detect: unclosed <tool> tag (opens but never closes). The
      // regex won't match it, so we just record that one existed.
      const unclosedMatch = /<tool\s+name="([a-zA-Z0-9_-]+)"\s*>[^<]*(?<!<\/)>(?![\s\S]*<\/tool>)/.exec(reply);
      // Simpler: if the reply contains a "<tool name=" without a
      // matching closing tag anywhere, treat the whole tag as bad.
      const hasOpenTag = /<tool\s+name="[a-zA-Z0-9_-]+"\s*>/.test(reply);
      const hasCloseTag = /<\/tool>/.test(reply);
      if (hasOpenTag && !hasCloseTag) {
        bad.push({ name: "(unclosed)", error: "tool tag opened but never closed" });
      } else if (unclosedMatch) {
        // (already covered by the simpler check above; kept for
        //  defence in depth in case the regex above misses)
        bad.push({ name: unclosedMatch[1], error: "tool tag opened but never closed" });
      }
      allCalls.push(...calls);
      if (calls.length === 0 && bad.length === 0) {
        return { reply, toolCalls: allCalls };
      }

      // Execute the well-formed calls.
      const results = [];
      for (const c of calls) {
        try {
          const r = await this.tools.call(c.name, c.params, this.ctx);
          results.push({ name: c.name, ok: true, result: r });
        } catch (err) {
          results.push({ name: c.name, ok: false, error: String(err?.message ?? err) });
        }
      }
      // Surface malformed/unclosed tags as explicit results so the
      // model can fix its output next round.
      for (const b of bad) {
        results.push({ name: b.name, ok: false, error: b.error });
      }

      // Detect a stuck loop: same set of resolved calls as last
      // round. Signature includes the tool name AND the result
      // status so that an error → same error is also caught.
      const signature = results
        .map((r) => `${r.name}:${r.ok ? "ok" : "err"}`)
        .sort()
        .join("|");
      if (signature && signature === lastSignature) {
        // Stuck. Stop early and surface the last set of results
        // to the caller so they know what happened.
        const stuckSummary = results
          .map((r) => `- ${r.name}: ${r.ok ? JSON.stringify(r.result) : "error: " + r.error}`)
          .join("\n");
        lastReply = `${reply}\n\n[stopped: same tool calls and results as previous round]\n\nLast tool results:\n${stuckSummary}`;
        break;
      }
      lastSignature = signature;

      messages.push({ role: "user", content: last });
      messages.push({ role: "assistant", content: reply });
      last =
        `Tool results:\n` +
        results
          .map((r) => `- ${r.name}: ${r.ok ? JSON.stringify(r.result) : "error: " + r.error}`)
          .join("\n") +
        `\n\nUse these results to answer the original question.`;
      if (i === this.maxRounds - 1) {
        // Final round - keep the last reply as the answer.
        lastReply = reply;
      }
    }
    return { reply: lastReply, toolCalls: allCalls };
  }
}

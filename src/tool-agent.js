// ToolAgent wraps a normal agent and adds a tool-calling loop:
// 1. Build a system prompt that lists available tools.
// 2. Ask the model.
// 3. If the model emits one or more <tool name="..."> {json} </tool>
//    blocks, execute them and feed the results back as a follow-up
//    message. Otherwise return the raw reply.

import { ToolRegistry } from "./tools.js";

const TOOL_TAG = /<tool\s+name="([a-zA-Z0-9_-]+)"\s*>([\s\S]*?)<\/tool>/g;

function extractToolCalls(text) {
  const calls = [];
  let m;
  TOOL_TAG.lastIndex = 0;
  while ((m = TOOL_TAG.exec(text)) !== null) {
    const name = m[1];
    const raw = m[2].trim();
    let params = {};
    if (raw) {
      try {
        params = JSON.parse(raw);
      } catch {
        // Treat as raw string param if schema allows, else skip.
        params = { expression: raw };
      }
    }
    calls.push({ name, params });
  }
  return calls;
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
    for (let i = 0; i < this.maxRounds; i++) {
      const reply = await this.llm.prompt({
        system: this._systemPrompt(),
        user: last,
        history: messages,
        maxTokens: 600,
      });
      lastReply = reply;
      const calls = extractToolCalls(reply);
      if (calls.length === 0) return { reply, toolCalls: [] };

      const results = [];
      for (const c of calls) {
        try {
          const r = await this.tools.call(c.name, c.params, this.ctx);
          results.push({ name: c.name, ok: true, result: r });
        } catch (err) {
          results.push({ name: c.name, ok: false, error: String(err?.message ?? err) });
        }
      }
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
    return { reply: lastReply, toolCalls: extractToolCalls(lastReply) };
  }
}

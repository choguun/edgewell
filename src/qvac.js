// Thin wrapper around @qvac/sdk so the rest of the app uses one stable API.
// All model access goes through EdgeWellLLM.

import { loadModel, completion, unloadModel } from "@qvac/sdk";
import * as sdk from "@qvac/sdk";

export class EdgeWellLLM {
  constructor({ model, onProgress, sdkExports = sdk } = {}) {
    this.model = model;
    this.onProgress = onProgress ?? (() => {});
    this.modelId = null;
    this._loadModel = sdkExports.loadModel ?? loadModel;
    this._completion = sdkExports.completion ?? completion;
    this._unloadModel = sdkExports.unloadModel ?? unloadModel;
  }

  async load() {
    if (this.modelId) return this.modelId;
    this.modelId = await this._loadModel({
      modelSrc: this.model,
      onProgress: this.onProgress,
    });
    return this.modelId;
  }

  async unload() {
    if (!this.modelId) return;
    await this._unloadModel({ modelId: this.modelId });
    this.modelId = null;
  }

  // Synchronous prompt. Returns the full reply string.
  async prompt({ system, user, history = [], maxTokens = 512, temperature = 0.3 } = {}) {
    await this.load();
    const fullHistory = [];
    if (system) fullHistory.push({ role: "system", content: system });
    for (const m of history) fullHistory.push(m);
    fullHistory.push({ role: "user", content: user });

    const result = this._completion({
      modelId: this.modelId,
      history: fullHistory,
      stream: false,
      maxTokens,
      temperature,
    });
    let text = "";
    if (result?.tokenStream) {
      for await (const tok of result.tokenStream) text += tok;
    } else if (typeof result?.text === "string") {
      text = result.text;
    } else if (typeof result === "string") {
      text = result;
    }
    return text.trim();
  }

  // Streaming prompt. Yields tokens as they arrive.
  async *stream({ system, user, history = [], maxTokens = 512, temperature = 0.3 } = {}) {
    await this.load();
    const fullHistory = [];
    if (system) fullHistory.push({ role: "system", content: system });
    for (const m of history) fullHistory.push(m);
    fullHistory.push({ role: "user", content: user });

    const result = this._completion({
      modelId: this.modelId,
      history: fullHistory,
      stream: true,
      maxTokens,
      temperature,
    });
    if (result?.tokenStream) {
      for await (const tok of result.tokenStream) yield tok;
    } else if (typeof result?.text === "string") {
      yield result.text;
    }
  }
}

// @ts-nocheck
// Thin wrapper around @qvac/sdk so the rest of the app uses one stable API.
// The SDK is loaded lazily so that tests and CLI startup do not require it.

export class EdgeWellLLM {
  constructor({ model, onProgress, sdkExports = null } = {}) {
    this.model = model;
    this.onProgress = onProgress ?? (() => {});
    this.modelId = null;
    this._sdk = sdkExports; // when null, we dynamic-import @qvac/sdk on load()
  }

  async _ensureSdk() {
    if (this._sdk) return this._sdk;
    try {
      this._sdk = await import("@qvac/sdk");
    } catch (err) {
      throw new Error(
        `@qvac/sdk is not installed. Run \`npm i @qvac/sdk\` to enable real inference. (${err?.message ?? err})`,
      );
    }
    return this._sdk;
  }

  async load() {
    if (this.modelId) return this.modelId;
    const sdk = await this._ensureSdk();
    this.modelId = await sdk.loadModel({
      modelSrc: this.model,
      onProgress: this.onProgress,
    });
    return this.modelId;
  }

  async unload() {
    if (!this.modelId) return;
    const sdk = await this._ensureSdk();
    await sdk.unloadModel({ modelId: this.modelId });
    this.modelId = null;
  }

  async _run({ system, user, history, maxTokens, temperature, stream }) {
    await this.load();
    const fullHistory = [];
    if (system) fullHistory.push({ role: "system", content: system });
    for (const m of history) fullHistory.push(m);
    fullHistory.push({ role: "user", content: user });
    return this._sdk.completion({
      modelId: this.modelId,
      history: fullHistory,
      stream,
      maxTokens,
      temperature,
    });
  }

  async prompt({ system, user, history = [], maxTokens = 512, temperature = 0.3 } = {}) {
    const result = await this._run({ system, user, history, maxTokens, temperature, stream: false });
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

  async *stream({ system, user, history = [], maxTokens = 512, temperature = 0.3 } = {}) {
    const result = await this._run({ system, user, history, maxTokens, temperature, stream: true });
    if (result?.tokenStream) {
      for await (const tok of result.tokenStream) yield tok;
    } else if (typeof result?.text === "string") {
      yield result.text;
    }
  }
}

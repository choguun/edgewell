// Thin wrapper around @qvac/sdk so the rest of the app uses one stable API.
// The SDK is loaded lazily so that tests and CLI startup do not require it.

import type { ChatMessage, LLM, PromptInput } from "./llm-types.js";

// Shape of the @qvac/sdk module. Imported dynamically so the real
// package doesn't need to be installed for tests or the CLI to
// start. The local stub at vendor/qvac-sdk/ matches this shape.
interface QvacSdk {
  loadModel(opts: { modelSrc?: string; onProgress?: (p: { loaded: number; total: number }) => void }): Promise<string>;
  unloadModel(opts: { modelId: string }): Promise<void>;
  completion(opts: {
    modelId: string;
    history: ChatMessage[];
    stream: boolean;
    maxTokens?: number;
    temperature?: number;
  }): Promise<
    | { tokenStream: AsyncIterable<string> }
    | { text: string }
    | string
  >;
}

export interface EdgeWellLLMOptions {
  model?: string;
  onProgress?: (p: { loaded: number; total: number }) => void;
  /** When null (default), the SDK is loaded lazily on first call. */
  sdkExports?: QvacSdk | null;
}

export interface EdgeWellLLM extends LLM {
  model: string;
  modelId: string | null;
  /** Load the model. Returns the modelId. */
  load(): Promise<string | null>;
  /** Unload the model. No-op if not loaded. */
  unload(): Promise<void>;
}

type CompletionResult = { tokenStream: AsyncIterable<string> } | { text: string } | string;

function isTokenStreamResult(
  r: CompletionResult,
): r is { tokenStream: AsyncIterable<string> } {
  return typeof r === "object" && r !== null && "tokenStream" in r;
}

async function textFromResult(result: CompletionResult): Promise<string> {
  if (typeof result === "string") return result;
  if (isTokenStreamResult(result)) {
    let text = "";
    for await (const tok of result.tokenStream) text += tok;
    return text;
  }
  return result.text;
}

export class EdgeWellLLM {
  public model: string;
  public onProgress: (p: { loaded: number; total: number }) => void;
  public modelId: string | null = null;
  /** When null, the SDK is loaded lazily on first call. */
  public _sdk: QvacSdk | null;
  /**
   * v3.0.2: `true` when the local vendor stub is in use.
   * Detected eagerly at construction time by attempting a
   * tiny `loadModel({})` against the SDK. The vendor stub
   * returns a `stub-model:<name>` id, which we then
   * recognise on every subsequent `isDemo()` call without
   * needing to wait for the first real completion.
   */
  public _isDemo: boolean = false;

  constructor({ model = "", onProgress, sdkExports = null }: EdgeWellLLMOptions = {}) {
    this.model = model;
    this.onProgress = onProgress ?? (() => {});
    this._sdk = sdkExports;
    // Eagerly detect demo mode so /health is correct on
    // the first call, before any chat has fired. The load
    // is a no-op for the vendor stub (returns immediately);
    // for a real SDK the load cost is the same as it would
    // be on the first chat call, so we don't pay it twice.
    this._probeDemo().catch(() => {
      /* best-effort; isDemo() still falls back to false */
    });
  }

  private async _probeDemo(): Promise<void> {
    try {
      const sdk = this._sdk ?? (await import("@qvac/sdk").catch(() => null));
      if (!sdk) return;
      this._sdk = sdk as QvacSdk;
      const id = await sdk.loadModel({ modelSrc: this.model });
      if (typeof id === "string" && id.startsWith("stub-model:")) {
        this._isDemo = true;
        this.modelId = id;
      }
    } catch {
      /* SDK not loadable; treat as real (non-demo) */
    }
  }

  /**
   * v3.0.2: `true` when the local vendor stub is in use
   * (i.e. `@qvac/sdk` is the link: stub and the model
   * returns canned responses). The companion's
   * /health exposes this so the web UI can show a
   * "demo mode" banner instead of letting the user think
   * the model is actually generating those responses.
   */
  isDemo(): boolean {
    if (this._isDemo) return true;
    if (typeof this.modelId === "string" && this.modelId.startsWith("stub-model:")) {
      return true;
    }
    return false;
  }

  async _ensureSdk(): Promise<QvacSdk> {
    if (this._sdk) return this._sdk;
    try {
      this._sdk = (await import("@qvac/sdk")) as unknown as QvacSdk;
    } catch (err) {
      const msg = (err as Error)?.message ?? String(err);
      throw new Error(
        `@qvac/sdk is not installed. Run \`npm i @qvac/sdk\` to enable real inference. (${msg})`,
      );
    }
    return this._sdk;
  }

  async load(): Promise<string | null> {
    if (this.modelId) return this.modelId;
    const sdk = await this._ensureSdk();
    this.modelId = await sdk.loadModel({
      modelSrc: this.model,
      onProgress: this.onProgress,
    });
    return this.modelId;
  }

  async unload(): Promise<void> {
    if (!this.modelId) return;
    const sdk = await this._ensureSdk();
    await sdk.unloadModel({ modelId: this.modelId });
    this.modelId = null;
  }

  private async _run({
    system,
    user,
    history,
    maxTokens,
    temperature,
    stream,
  }: PromptInput & { stream: boolean }): Promise<
    { tokenStream: AsyncIterable<string> } | { text: string } | string
  > {
    await this.load();
    const fullHistory: ChatMessage[] = [];
    if (system) fullHistory.push({ role: "system", content: system });
    for (const m of history ?? []) fullHistory.push(m);
    fullHistory.push({ role: "user", content: user });
    return this._sdk!.completion({
      modelId: this.modelId ?? "",
      history: fullHistory,
      stream,
      maxTokens,
      temperature,
    });
  }

  async prompt({
    system,
    user,
    history = [],
    maxTokens = 512,
    temperature = 0.3,
  }: PromptInput = {} as PromptInput): Promise<string> {
    const result = await this._run({
      system,
      user: user ?? "",
      history,
      maxTokens,
      temperature,
      stream: false,
    });
    return (await textFromResult(result)).trim();
  }

  async *stream({
    system,
    user,
    history = [],
    maxTokens = 512,
    temperature = 0.3,
  }: PromptInput = {} as PromptInput): AsyncIterable<string> {
    const result = await this._run({
      system,
      user: user ?? "",
      history,
      maxTokens,
      temperature,
      stream: true,
    });
    if (typeof result === "string") {
      yield result;
      return;
    }
    if (isTokenStreamResult(result)) {
      for await (const tok of result.tokenStream) yield tok;
      return;
    }
    yield result.text;
  }
}

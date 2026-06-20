// Thin wrapper around @qvac/sdk so the rest of the app uses one stable API.
// The SDK is loaded lazily so that tests and CLI startup do not require it.

import type { ChatMessage, LLM, PromptInput } from "./llm-types.js";

// Shape of the @qvac/sdk module. v3.0.2: the real SDK has a
// richer surface than the legacy stub used to expose. The key
// changes are:
//   - `loadModel` now takes `modelType` (e.g.
//     "llamacpp-completion") and a `modelConfig` block, and
//     accepts either a model-id string or a `ModelDescriptor`
//     constant exported by the SDK.
//   - `completion` returns a `CompletionRun` whose canonical
//     surface is `.events` (an AsyncIterable of typed events
//     like `contentDelta`, `rawDelta`, `thinkingDelta`,
//     `toolCall`, `completionDone`) and `.final` (a Promise
//     for the aggregated result). The legacy `tokenStream` /
//     `text` properties still exist but are deprecated; we use
//     the new event stream.
// We import the type via `await import("@qvac/sdk")` and
// treat the module as a black box for the fields we touch.
interface QvacSdkModelDescriptor {
  name: string;
  [key: string]: unknown;
}

interface QvacSdkCompletionEvent {
  type: string;
  seq?: number;
  text?: string;
  [key: string]: unknown;
}

interface QvacSdkCompletionRun {
  events: AsyncIterable<QvacSdkCompletionEvent>;
  final: Promise<{ content: string; [key: string]: unknown }>;
  // Legacy conveniences (still exported by the SDK):
  tokenStream?: AsyncIterable<string>;
  text?: string;
}

interface QvacSdk {
  loadModel(opts: {
    modelSrc: string | QvacSdkModelDescriptor;
    modelType?: string;
    modelConfig?: Record<string, unknown>;
    onProgress?: (p: { loaded: number; total: number }) => void;
  }): Promise<string> & { requestId?: string };
  unloadModel(opts: { modelId: string }): Promise<void>;
  completion(opts: {
    modelId: string;
    history: ChatMessage[];
    stream?: boolean;
    maxTokens?: number;
    temperature?: number;
    captureThinking?: boolean;
  }): Promise<QvacSdkCompletionRun>;
  // Marker set by the vendor stub so isDemo() can detect
  // demo mode without making any network calls.
  __isStub?: boolean;
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

type CompletionResult = QvacSdkCompletionRun;

async function textFromResult(result: CompletionResult): Promise<string> {
  // Drain the events stream into a single string. The real
  // SDK exposes typed events (contentDelta, rawDelta, etc.);
  // we keep the public surface simple by concatenating the
  // `text` of every event. For more advanced use (tool
  // calls, thinking tokens) the orchestrator would need to
  // inspect the event stream directly.
  let text = "";
  for await (const ev of result.events) {
    if (typeof ev?.text === "string") text += ev.text;
  }
  // Prefer the aggregated final result if the SDK
  // populated it (saves re-iterating the events), but fall
  // back to whatever we accumulated.
  try {
    const finalText = (await result.final)?.content;
    if (typeof finalText === "string" && finalText.length > 0) return finalText;
  } catch {
    /* final may reject if the stream errored; keep what we have */
  }
  return text;
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
      // v3.0.2: detect demo mode WITHOUT loading a model.
      // The vendor stub exports `__isStub = true`; the real
      // SDK doesn't. This way /health can report demo=true
      // on the first call without paying the cost of a
      // 700+ MB model download just to ask "are we a stub?".
      const sdk = this._sdk ?? (await import("@qvac/sdk").catch(() => null));
      if (!sdk) return;
      this._sdk = sdk as QvacSdk;
      if ((sdk as { __isStub?: boolean }).__isStub === true) {
        this._isDemo = true;
      }
    } catch {
      /* best-effort */
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
    // v3.0.2: the real SDK needs a `ModelDescriptor` constant
    // (not a plain string) so it can infer the engine.
    // Look the constant up on the SDK by name. If the user
    // passed a string we don't know, we fall back to
    // `modelType: "llamacpp-completion"` which is what the
    // EdgeWell config uses today.
    const modelSrc = (sdk as unknown as Record<string, unknown>)[this.model]
      ?? this.model;
    try {
      this.modelId = await sdk.loadModel({
        modelSrc: modelSrc as never,
        modelType: "llamacpp-completion",
        modelConfig: { ctx_size: 2048 },
        onProgress: this.onProgress,
      });
    } catch (err) {
      // If the lookup-by-constant path failed too, the
      // original error is more informative; re-raise it.
      throw err;
    }
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
  }: PromptInput & { stream: boolean }): Promise<QvacSdkCompletionRun> {
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
    // The real SDK yields typed events; we forward the `text`
    // of every `contentDelta` (and any other event that
    // happens to carry a text payload) so the caller sees
    // the same token stream it used to get from the stub.
    for await (const ev of result.events) {
      if (typeof ev?.text === "string" && ev.text.length > 0) {
        yield ev.text;
      }
    }
  }
}

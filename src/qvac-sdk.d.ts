// Type declaration for the @qvac/sdk module. The real package is
// not on the public registry; src/qvac.ts dynamic-imports it and
// falls back to a stub at vendor/qvac-sdk/ when missing. The
// runtime shape is the QvacSdk interface in src/qvac.ts; this
// declaration re-states it for the module-resolution layer.

declare module "@qvac/sdk" {
  export function loadModel(opts: {
    modelSrc?: string;
    onProgress?: (p: { loaded: number; total: number }) => void;
  }): Promise<string>;

  export function unloadModel(opts: { modelId: string }): Promise<void>;

  export function completion(opts: {
    modelId: string;
    history: Array<{ role: string; content: string }>;
    stream: boolean;
    maxTokens?: number;
    temperature?: number;
  }): Promise<
    | { tokenStream: AsyncIterable<string> }
    | { text: string }
    | string
  >;
}
